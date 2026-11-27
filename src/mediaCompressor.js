const MiB = 1024 * 1024;

export function formatMediaBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MiB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MiB).toFixed(2)} MB`;
}

function report(onProgress, phase, progress, message, extra = {}) {
  onProgress?.({ phase, progress: Math.max(0, Math.min(100, progress)), message, ...extra });
}


export function isAnimatedImageBytes(type, bytes) {
  const mime = String(type || '').toLowerCase().split(';')[0];
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes || []);
  if (mime === 'image/gif') return bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  const hasChunk = (chunk) => {
    for (let i = 0; i <= bytes.length - chunk.length; i += 1) {
      let match = true;
      for (let j = 0; j < chunk.length; j += 1) {
        if (bytes[i + j] !== chunk.charCodeAt(j)) { match = false; break; }
      }
      if (match) return true;
    }
    return false;
  };
  if (mime === 'image/png' || mime === 'image/apng') return hasChunk('acTL');
  if (mime === 'image/webp') return hasChunk('ANIM') || hasChunk('ANMF');
  return false;
}

async function fileHasAnimation(file) {
  const mime = String(file && file.type || '').toLowerCase().split(';')[0];
  if (mime === 'image/gif') return true;
  if (!['image/png', 'image/apng', 'image/webp'].includes(mime) || typeof file.arrayBuffer !== 'function') return false;
  return isAnimatedImageBytes(mime, new Uint8Array(await file.arrayBuffer()));
}

function makeFile(blob, name, type) {
  const safeName = name.replace(/\.[^.]+$/, '');
  return new File([blob], `${safeName}.${type === 'image/webp' ? 'webp' : type === 'video/mp4' ? 'mp4' : 'webm'}`, {
    type,
    lastModified: Date.now(),
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode this media.')), type, quality);
  });
}

async function compressImage(file, options, onProgress) {
  report(onProgress, 'compressing', 4, 'Decoding image on this device…');
  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = options.maxDimension || 1920;
    const cropSquare = options.cropSquare === true;
    const sourceSide = Math.min(bitmap.width, bitmap.height);
    const scale = cropSquare ? Math.min(1, maxDimension / sourceSide) : Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round((cropSquare ? sourceSide : bitmap.width) * scale));
    const height = Math.max(1, Math.round((cropSquare ? sourceSide : bitmap.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('This browser cannot create an image canvas.');
    if (cropSquare) {
      const sx = (bitmap.width - sourceSide) / 2;
      const sy = (bitmap.height - sourceSide) / 2;
      context.drawImage(bitmap, sx, sy, sourceSide, sourceSide, 0, 0, width, height);
    } else {
      context.drawImage(bitmap, 0, 0, width, height);
    }

    report(onProgress, 'compressing', 24, `Resized to ${width} × ${height}. Encoding WebP…`);
    const minQuality = options.minQuality ?? 0.48;
    let quality = options.quality ?? 0.82;
    let blob = null;
    let pass = 0;
    while (quality >= minQuality - 0.001) {
      pass += 1;
      report(onProgress, 'compressing', 28 + Math.min(58, pass * 14), `Optimising image quality (pass ${pass})…`);
      blob = await canvasBlob(canvas, 'image/webp', quality);
      if (blob.size <= (options.targetBytes || Infinity)) break;
      quality = Math.round((quality - 0.1) * 100) / 100;
    }
    if (!blob) throw new Error('Image compression failed.');
    const converted = makeFile(blob, file.name, 'image/webp');
    if (converted.size >= file.size) {
      report(onProgress, 'done', 100, 'This image is already optimised. Keeping the original file.', { originalSize: file.size, outputSize: file.size, savedBytes: 0 });
      return { file, compressed: false, reason: 'already-optimised' };
    }
    report(onProgress, 'done', 100, `Image compressed: ${formatMediaBytes(file.size)} → ${formatMediaBytes(converted.size)}.`, {
      originalSize: file.size, outputSize: converted.size, savedBytes: file.size - converted.size,
    });
    return { file: converted, compressed: true, reason: 'compressed' };
  } finally {
    bitmap.close?.();
  }
}

function waitForEvent(target, successEvent, failureEvent = 'error') {
  return new Promise((resolve, reject) => {
    const onSuccess = () => { cleanup(); resolve(); };
    const onFailure = () => { cleanup(); reject(new Error('The browser could not read this video.')); };
    const cleanup = () => {
      target.removeEventListener(successEvent, onSuccess);
      target.removeEventListener(failureEvent, onFailure);
    };
    target.addEventListener(successEvent, onSuccess, { once: true });
    target.addEventListener(failureEvent, onFailure, { once: true });
  });
}

async function compressVideo(file, options, onProgress) {
  if (typeof MediaRecorder === 'undefined') throw new Error('Video compression is not supported by this browser.');
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  video.preload = 'auto';
  video.playsInline = true;
  video.src = objectUrl;
  video.volume = 0;
  video.muted = false;
  video.crossOrigin = 'anonymous';
  report(onProgress, 'compressing', 2, 'Opening video on this device…');

  let outputStream = null;
  let sourceStream = null;
  let animationFrame = 0;
  let recorder = null;
  const chunks = [];

  try {
    const metadataReady = waitForEvent(video, 'loadedmetadata');
    video.load();
    await metadataReady;
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('This video has no readable duration.');
    if (duration > (options.maxVideoSeconds || 240)) throw new Error('For device memory, videos over 4 minutes are kept original.');

    const maxDimension = options.maxDimension || 1280;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(2, Math.floor(video.videoWidth * scale / 2) * 2);
    const height = Math.max(2, Math.floor(video.videoHeight * scale / 2) * 2);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This browser cannot create a video canvas.');
    if (typeof canvas.captureStream !== 'function') throw new Error('Video canvas capture is not supported on this device.');

    const preferredTypes = [
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType = preferredTypes.find(type => MediaRecorder.isTypeSupported?.(type));
    if (!mimeType) throw new Error('No supported WebM encoder was found in this browser.');

    outputStream = canvas.captureStream(options.fps || 24);
    const capture = video.captureStream || video.webkitCaptureStream;
    if (capture) {
      sourceStream = capture.call(video);
      sourceStream.getAudioTracks().forEach(track => outputStream.addTrack(track));
    }

    const pixels = width * height;
    const defaultBitrate = options.videoBitsPerSecond || (pixels >= 1920 * 1080 ? 2200000 : pixels >= 1280 * 720 ? 1300000 : 750000);
    const targetBitrate = options.targetBytes ? Math.floor((options.targetBytes * 8 / duration) * 0.88) - 96000 : defaultBitrate;
    const bitrate = Math.max(250000, Math.min(defaultBitrate, targetBitrate));
    recorder = new MediaRecorder(outputStream, {
      mimeType,
      videoBitsPerSecond: bitrate,
      audioBitsPerSecond: 96000,
    });

    const recording = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('The browser video encoder stopped unexpectedly.'));
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        if (!blob.size) reject(new Error('The browser produced an empty video.'));
        else resolve(blob);
      };
    });

    let lastReported = 0;
    const drawFrame = () => {
      if (video.readyState >= 2 && !video.ended) {
        context.drawImage(video, 0, 0, width, height);
        const current = Math.min(99, Math.round((video.currentTime / duration) * 100));
        if (current >= lastReported + 2 || current === 99) {
          lastReported = current;
          report(onProgress, 'compressing', current, `Re-encoding video ${Math.floor(video.currentTime)}s / ${Math.ceil(duration)}s…`);
        }
      }
      if (!video.ended && recorder?.state === 'recording') animationFrame = requestAnimationFrame(drawFrame);
    };

    recorder.start(500);
    report(onProgress, 'compressing', 3, `Transcoding video to ${width} × ${height} WebM on this device…`);
    const playback = video.play();
    if (playback?.then) await playback;
    drawFrame();
    video.addEventListener('ended', () => {
      if (recorder?.state === 'recording') recorder.stop();
    }, { once: true });

    const blob = await recording;
    const outputType = recorder.mimeType?.includes('mp4') ? 'video/mp4' : 'video/webm';
    const output = makeFile(blob, file.name, outputType);
    if (output.size >= file.size) {
      report(onProgress, 'done', 100, `Video is already as small as the compressed copy. Keeping original (${formatMediaBytes(file.size)}).`, {
        originalSize: file.size, outputSize: file.size, savedBytes: 0,
      });
      return { file, compressed: false, reason: 'already-optimised' };
    }
    report(onProgress, 'done', 100, `Video compressed: ${formatMediaBytes(file.size)} → ${formatMediaBytes(output.size)}.`, {
      originalSize: file.size, outputSize: output.size, savedBytes: file.size - output.size,
    });
    return { file: output, compressed: true, reason: 'compressed' };
  } finally {
    cancelAnimationFrame(animationFrame);
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch {}
    }
    outputStream?.getTracks().forEach(track => track.stop());
    sourceStream?.getTracks().forEach(track => track.stop());
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressMediaFile(file, options = {}) {
  const onProgress = options.onProgress;
  if (!file) throw new Error('Choose a media file first.');
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (file.type === 'image/svg+xml' || (!isImage && !isVideo)) {
    report(onProgress, 'done', 100, 'This media format is kept original to preserve its file data.', {
      originalSize: file.size, outputSize: file.size, savedBytes: 0,
    });
    return { file, compressed: false, reason: 'format-preserved' };
  }

  try {
    if (isImage && await fileHasAnimation(file)) {
      report(onProgress, 'done', 100, 'Animation detected. Keeping every frame original so it stays animated.', {
        originalSize: file.size, outputSize: file.size, savedBytes: 0,
      });
      return { file, compressed: false, reason: 'animation-preserved' };
    }
    if (isImage) return await compressImage(file, options, onProgress);
    return await compressVideo(file, options, onProgress);
  } catch (error) {
    if (isVideo) {
      report(onProgress, 'done', 100, `Video compression unavailable here. Keeping original: ${error.message}`, {
        originalSize: file.size, outputSize: file.size, savedBytes: 0,
      });
      return { file, compressed: false, reason: 'unsupported', error };
    }
    report(onProgress, 'error', 100, error?.message || 'Image compression failed.');
    throw error;
  }
}
