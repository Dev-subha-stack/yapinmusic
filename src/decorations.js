import {
  getAccountState,
  subscribeAccount,
  getDecorations,
  submitCommunityDecoration,
  wearCommunityDecoration,
  removeCommunityDecoration,
  withdrawCommunityDecoration,
  sendPresenceHeartbeat,
  getAdminAccess,
  getAdminDashboard,
  getYapinAdmins,
  grantYapinAdmin,
  removeYapinAdmin,
  moderateCommunityDecoration
} from './services/leaderboard.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

function makeButton(label, className, onClick) {
  const button = el('button', className || 'btn', label);
  button.type = 'button';
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

function addNotice(parent, message, isError) {
  const notice = el('p', 'community-notice' + (isError ? ' is-error' : ''), message);
  parent.appendChild(notice);
  return notice;
}

function statusLabel(status) {
  const labels = {
    pending: 'Waiting for review',
    approved: 'Approved',
    rejected: 'Not approved',
    removed: 'Taken down'
  };
  return labels[status] || 'Unknown status';
}

function renderDecorationImage(parent, source, alt) {
  const frame = el('div', 'community-decor-image-frame');
  const image = el('img', 'community-decor-image');
  image.src = source;
  image.alt = alt || 'Avatar decoration';
  image.loading = 'lazy';
  image.onerror = function () {
    frame.replaceChildren(el('span', 'community-image-error', 'Preview unavailable'));
  };
  frame.appendChild(image);
  parent.appendChild(frame);
  return frame;
}

function fileAsDataUrl(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(String(reader.result || '')); };
    reader.onerror = function () { reject(new Error('Your browser could not read this decoration.')); };
    reader.readAsDataURL(file);
  });
}

function canvasBlob(canvas, quality) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (blob) resolve(blob);
      else reject(new Error('Your browser could not prepare this image.'));
    }, 'image/webp', quality);
  });
}

async function prepareDecorationImage(file) {
  if (!file || !['image/png', 'image/webp'].includes(String(file.type || '').toLowerCase())) {
    throw new Error('Choose a transparent PNG or WebP image.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('The original file must be 8 MB or smaller.');
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error('That image could not be opened. Try exporting it as PNG or WebP.');
  }

  try {
    if (bitmap.width !== bitmap.height) {
      throw new Error('Decorations must be square so they line up with the avatar.');
    }
    if (bitmap.width < 192 || bitmap.height < 192) {
      throw new Error('This image is too small. Use at least 192×192; 512×512 is best.');
    }

    const checkCanvas = document.createElement('canvas');
    checkCanvas.width = 128;
    checkCanvas.height = 128;
    const checkContext = checkCanvas.getContext('2d', { willReadFrequently: true });
    checkContext.clearRect(0, 0, 128, 128);
    checkContext.drawImage(bitmap, 0, 0, 128, 128);
    const pixels = checkContext.getImageData(0, 0, 128, 128).data;
    const safeRadius = 35;
    for (let y = 0; y < 128; y += 1) {
      for (let x = 0; x < 128; x += 1) {
        const dx = x + 0.5 - 64;
        const dy = y + 0.5 - 64;
        if ((dx * dx) + (dy * dy) <= safeRadius * safeRadius && pixels[((y * 128) + x) * 4 + 3] > 0) {
          throw new Error('Keep the entire dashed avatar circle transparent. Even a few pixels inside it will be turned down.');
        }
      }
    }

    let size = Math.min(512, bitmap.width);
    let quality = 0.9;
    let blob = null;
    while (size >= 192) {
      const output = document.createElement('canvas');
      output.width = size;
      output.height = size;
      const context = output.getContext('2d');
      context.clearRect(0, 0, size, size);
      context.drawImage(bitmap, 0, 0, size, size);
      blob = await canvasBlob(output, quality);
      if (blob.size <= 265000) break;
      if (quality > 0.72) quality -= 0.09;
      else {
        size = size === 512 ? 448 : (size === 448 ? 384 : (size === 384 ? 320 : 256));
        quality = 0.78;
      }
      if (size < 192) break;
    }
    if (!blob || blob.size > 265000) {
      throw new Error('This decoration is too large after compression. Simplify the artwork and try again.');
    }
    const dataUrl = await fileAsDataUrl(blob);
    if (dataUrl.length > 360000) {
      throw new Error('The compressed image is still too large. Try a simpler 512×512 design.');
    }
    return dataUrl;
  } finally {
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
  }
}

export function createDecorationsUI() {
  const root = document.getElementById('v-decorations');
  let accountState = getAccountState();
  let snapshot = null;
  let activeTab = 'included';
  let page = 1;
  let loading = false;
  let selectedFile = null;
  let previewUrl = '';
  let loadRequest = 0;

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }

  function renderRules(parent) {
    const rules = el('section', 'community-rules');
    rules.appendChild(el('h3', null, 'What gets approved'));
    const items = [
      'Your own art. Nothing from Discord, other apps or the internet, no traced or AI-looking copies.',
      'Nothing on the avatar circle, not even a few pixels. The dashed ring in the preview shows where it is.',
      'Lined up with the avatar, nothing cut off at the edges.',
      'Light at the bottom. The name sits right under it.',
      'Sharp: at least 192×192, 512×512 is best. It shows up to 192 px wide (twice that on sharp screens), so anything smaller gets stretched and looks blurry.',
      'No nudity, gore or hate.'
    ];
    const list = el('ul');
    items.forEach(function (item) { list.appendChild(el('li', null, item)); });
    rules.appendChild(list);
    rules.appendChild(el('p', 'community-rules-note', 'These are the same reasons staff pick when they turn one down.'));
    parent.appendChild(rules);
  }

  function renderMine(parent) {
    if (!accountState.user) {
      addNotice(parent, 'Sign in to view your submissions and see their review status.');
      parent.appendChild(makeButton('Open profile', 'btn primary', function () { location.hash = '#profile'; }));
      return;
    }
    const items = snapshot && Array.isArray(snapshot.mine) ? snapshot.mine : [];
    if (!items.length) {
      parent.appendChild(el('div', 'community-empty', 'You have not submitted a decoration yet.'));
      parent.appendChild(makeButton('Make a decoration', 'btn primary', function () {
        activeTab = 'make';
        render();
      }));
      return;
    }
    const grid = el('div', 'community-decor-grid');
    items.forEach(function (item) {
      const card = el('article', 'community-decor-card');
      renderDecorationImage(card, item.image_data, item.name);
      const details = el('div', 'community-decor-details');
      details.appendChild(el('h3', null, item.name));
      const status = el('span', 'community-status status-' + item.status, statusLabel(item.status));
      details.appendChild(status);
      details.appendChild(el('p', 'community-decor-meta', String(item.wearer_count || 0) + ' player' + (Number(item.wearer_count) === 1 ? '' : 's') + ' wearing'));
      if (item.review_note) details.appendChild(el('p', 'community-review-note', item.review_note));
      const actions = el('div', 'community-decor-actions');
      if (item.status === 'approved') {
        if (item.worn_by_me) {
          actions.appendChild(makeButton('Remove from avatar', 'btn', async function () {
            try { await removeCommunityDecoration(); await refresh(); }
            catch (error) { addNotice(root, error.message, true); }
          }));
        } else {
          actions.appendChild(makeButton('Wear', 'btn primary', async function () {
            try { await wearCommunityDecoration(item.id); await refresh(); }
            catch (error) { addNotice(root, error.message, true); }
          }));
        }
      }
      if (item.status === 'approved' || item.status === 'pending') {
        actions.appendChild(makeButton('Take down', 'btn community-danger', async function () {
          if (!window.confirm('Take down "' + item.name + '"? Players wearing it will lose this decoration.')) return;
          try { await withdrawCommunityDecoration(item.id); await refresh(); }
          catch (error) { addNotice(root, error.message, true); }
        }));
      }
      details.appendChild(actions);
      card.appendChild(details);
      grid.appendChild(card);
    });
    parent.appendChild(grid);
  }

  function renderIncluded(parent) {
    const intro = el('p', 'community-included-intro', 'Ready-to-wear Yapin designs. No submission or approval needed — pick one and it appears around your avatar.');
    parent.appendChild(intro);
    const grid = el('div', 'community-decor-grid community-included-grid');
    PRESET_DECORATIONS.forEach(function (item) {
      const card = el('article', 'community-decor-card community-included-card');
      renderDecorationImage(card, getBuiltInDecorationImage(item.id), item.name);
      const details = el('div', 'community-decor-details');
      details.appendChild(el('h3', null, item.name));
      details.appendChild(el('p', 'community-decor-creator', item.subtitle));
      details.appendChild(el('p', 'community-decor-meta', item.description));
      const count = snapshot && snapshot.presetWearCounts ? Number(snapshot.presetWearCounts[item.id]) || 0 : 0;
      details.appendChild(el('p', 'community-decor-meta', count.toLocaleString() + ' player' + (count === 1 ? '' : 's') + ' wearing'));
      const actions = el('div', 'community-decor-actions');
      const wearing = Boolean(snapshot && snapshot.activePresetDecoration === item.id);
      if (!accountState.user) {
        actions.appendChild(makeButton('Sign in to wear', 'btn primary', function () { location.hash = '#profile'; }));
      } else if (wearing) {
        actions.appendChild(makeButton('Wearing · Remove', 'btn', async function () {
          try { await removeCommunityDecoration(); await refresh(); }
          catch (error) { addNotice(root, error.message || 'Could not remove the decoration.', true); }
        }));
      } else {
        actions.appendChild(makeButton('Wear decoration', 'btn primary', async function () {
          try { await wearPresetDecoration(item.id); await refresh(); }
          catch (error) { addNotice(root, error.message || 'Could not apply the decoration.', true); }
        }));
      }
      details.appendChild(actions);
      card.appendChild(details);
      grid.appendChild(card);
    });
    parent.appendChild(grid);
  }

  function renderCommunity(parent) {
    const items = snapshot && Array.isArray(snapshot.community) ? snapshot.community : [];
    if (!items.length) {
      parent.appendChild(el('div', 'community-empty', 'No community decorations have been approved yet. Be the first artist to submit one.'));
      return;
    }
    const grid = el('div', 'community-decor-grid');
    items.forEach(function (item) {
      const card = el('article', 'community-decor-card');
      renderDecorationImage(card, item.image_data, item.name);
      const details = el('div', 'community-decor-details');
      details.appendChild(el('h3', null, item.name));
      details.appendChild(el('p', 'community-decor-creator', 'by ' + (item.creator_username || 'Yapin artist')));
      details.appendChild(el('p', 'community-decor-meta', String(item.wearer_count || 0) + ' player' + (Number(item.wearer_count) === 1 ? '' : 's') + ' wearing'));
      const actions = el('div', 'community-decor-actions');
      if (accountState.user) {
        if (item.worn_by_me) {
          actions.appendChild(makeButton('Wearing · Remove', 'btn', async function () {
            try { await removeCommunityDecoration(); await refresh(); }
            catch (error) { addNotice(root, error.message, true); }
          }));
        } else {
          actions.appendChild(makeButton('Wear decoration', 'btn primary', async function () {
            try { await wearCommunityDecoration(item.id); await refresh(); }
            catch (error) { addNotice(root, error.message, true); }
          }));
        }
      } else {
        actions.appendChild(makeButton('Sign in to wear', 'btn primary', function () { location.hash = '#profile'; }));
      }
      details.appendChild(actions);
      card.appendChild(details);
      grid.appendChild(card);
    });
    parent.appendChild(grid);
    if (snapshot && snapshot.hasMore) {
      parent.appendChild(makeButton(loading ? 'Loading…' : 'Load more', 'btn community-load-more', function () {
        page += 1;
        refresh(true);
      }));
    }
  }

  function renderMake(parent) {
    if (!accountState.user) {
      addNotice(parent, 'Sign in with Yapin or email to submit your own decoration.');
      parent.appendChild(makeButton('Open profile', 'btn primary', function () { location.hash = '#profile'; }));
      return;
    }
    if (!accountState.profile) {
      addNotice(parent, 'Create your public player profile first, then come back to submit a decoration.');
      parent.appendChild(makeButton('Set up profile', 'btn primary', function () { location.hash = '#profile'; }));
      return;
    }
    const limit = snapshot ? snapshot.submissionLimit : 3;
    const pending = snapshot ? snapshot.pendingCount : 0;
    const artist = snapshot && snapshot.artistBadge;
    const info = el('div', 'community-artist-info');
    if (artist) {
      info.appendChild(el('strong', null, '✦ Artist badge unlocked'));
      info.appendChild(el('p', null, 'You can have up to 6 decorations waiting for review at once.'));
    } else {
      info.appendChild(el('strong', null, 'Your first approved decoration unlocks the Artist badge.'));
      info.appendChild(el('p', null, 'After that, you can have up to 6 decorations waiting for review at once.'));
    }
    info.appendChild(el('p', 'community-pending-count', pending + ' / ' + limit + ' pending submissions'));
    parent.appendChild(info);

    const form = el('form', 'community-submit-form');
    const pickerLabel = el('label', 'community-file-picker');
    pickerLabel.appendChild(el('span', null, 'Pick a picture'));
    const picker = el('input');
    picker.type = 'file';
    picker.accept = '.png,.webp,image/png,image/webp';
    picker.setAttribute('aria-label', 'Choose a transparent PNG or WebP decoration');
    pickerLabel.appendChild(picker);

    const preview = el('div', 'community-upload-preview');
    const previewImage = el('img');
    previewImage.alt = 'Decoration preview';
    previewImage.hidden = true;
    const safeRing = el('span', 'community-safe-ring');
    safeRing.setAttribute('aria-hidden', 'true');
    preview.appendChild(previewImage);
    preview.appendChild(safeRing);

    picker.addEventListener('change', function () {
      clearPreview();
      selectedFile = picker.files && picker.files[0] ? picker.files[0] : null;
      previewImage.hidden = !selectedFile;
      if (selectedFile) {
        previewUrl = URL.createObjectURL(selectedFile);
        previewImage.src = previewUrl;
      } else {
        previewImage.removeAttribute('src');
      }
    });

    const nameLabel = el('label', 'community-name-field');
    nameLabel.appendChild(el('span', null, 'Name it'));
    const nameInput = el('input');
    nameInput.type = 'text';
    nameInput.maxLength = 32;
    nameInput.minLength = 2;
    nameInput.required = true;
    nameInput.placeholder = 'e.g. Crimson Orbit';
    nameLabel.appendChild(nameInput);

    const attestationLabel = el('label', 'community-attestation');
    const attestation = el('input');
    attestation.type = 'checkbox';
    attestation.required = true;
    const attestationCopy = el('span', null, "I made this myself. It isn't taken from someone else or the internet, and it is not traced or AI-looking copy.");
    attestationLabel.appendChild(attestation);
    attestationLabel.appendChild(attestationCopy);

    const help = el('p', 'community-upload-help', 'Transparent PNG or WebP · square artwork · 192×192 minimum · 512×512 recommended · compressed to 265 KB or less.');
    const message = el('p', 'community-form-message');
    const submit = el('button', 'btn primary community-submit-button', 'Send it in');
    submit.type = 'submit';
    submit.disabled = pending >= limit;
    form.appendChild(pickerLabel);
    form.appendChild(preview);
    form.appendChild(nameLabel);
    form.appendChild(attestationLabel);
    form.appendChild(help);
    form.appendChild(message);
    form.appendChild(submit);
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!selectedFile || submit.disabled) {
        message.textContent = 'Choose your decoration image first.';
        message.classList.add('is-error');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Preparing image…';
      message.textContent = 'Checking the image size and protected avatar circle…';
      message.classList.remove('is-error');
      try {
        const imageData = await prepareDecorationImage(selectedFile);
        submit.textContent = 'Submitting…';
        message.textContent = 'Sending your decoration for staff review…';
        await submitCommunityDecoration({
          name: nameInput.value,
          imageData,
          originalArtAttested: attestation.checked
        });
        selectedFile = null;
        clearPreview();
        await refresh();
        activeTab = 'mine';
        render();
      } catch (error) {
        message.textContent = error.message || 'The decoration could not be submitted.';
        message.classList.add('is-error');
        submit.disabled = false;
        submit.textContent = 'Send it in';
      }
    });
    parent.appendChild(form);
    renderRules(parent);
  }

  function render() {
    if (!root) return;
    root.replaceChildren();
    const pageWrap = el('div', 'community-page');
    const head = el('div', 'community-page-head');
    const copy = el('div');
    copy.appendChild(el('p', 'lb-eyebrow', 'MAKE YOUR PLAYER CARD YOURS'));
    copy.appendChild(el('h1', null, 'Avatar decorations'));
    copy.appendChild(el('p', 'lede', 'Browse community artwork, wear a favourite, or submit an original design for review.'));
    head.appendChild(copy);
    head.appendChild(makeButton('Refresh', 'btn', function () { page = 1; refresh(); }));
    pageWrap.appendChild(head);

    const tabs = el('div', 'community-tabs');
    [
      ['included', 'Included'],
      ['community', 'Community'],
      ['mine', 'My decorations'],
      ['make', 'Make a decoration']
    ].forEach(function (tab) {
      const button = makeButton(tab[1], 'community-tab' + (activeTab === tab[0] ? ' is-active' : ''), function () {
        activeTab = tab[0];
        render();
      });
      button.setAttribute('aria-pressed', String(activeTab === tab[0]));
      tabs.appendChild(button);
    });
    pageWrap.appendChild(tabs);

    const content = el('section', 'community-content');
    if (loading && !snapshot) {
      addNotice(content, 'Loading decorations…');
    } else if (activeTab === 'included') {
      renderIncluded(content);
    } else if (activeTab === 'community') {
      renderCommunity(content);
    } else if (activeTab === 'mine') {
      renderMine(content);
    } else {
      renderMake(content);
    }
    pageWrap.appendChild(content);
    root.appendChild(pageWrap);
  }

  async function refresh(append) {
    if (loading) return;
    loading = true;
    const request = ++loadRequest;
    if (!append) render();
    try {
      const result = await getDecorations(append ? page : 1);
      if (request !== loadRequest) return;
      if (append && snapshot) {
        result.community = (snapshot.community || []).concat(result.community || []);
      }
      snapshot = result;
      render();
    } catch (error) {
      if (request === loadRequest) {
        root.replaceChildren();
        const pageWrap = el('div', 'community-page');
        pageWrap.appendChild(el('h1', null, 'Avatar decorations'));
        addNotice(pageWrap, error.message || 'Could not load decorations. Try again.', true);
        pageWrap.appendChild(makeButton('Try again', 'btn primary', function () { refresh(); }));
        root.appendChild(pageWrap);
      }
    } finally {
      if (request === loadRequest) loading = false;
    }
  }

  return {
    init: function () {
      accountState = getAccountState();
      refresh();
    },
    onAccountChange: function (state) {
      const previousId = accountState.user && accountState.user.id;
      accountState = state;
      const nextId = accountState.user && accountState.user.id;
      if (previousId !== nextId) {
        loadRequest += 1;
        loading = false;
        snapshot = null;
        page = 1;
        refresh();
      }
    }
  };
}

export function createAdminUI() {
  const root = document.getElementById('v-admin');
  let initialized = false;
  let loading = false;
  let currentSnapshot = null;
  let adminUsers = [];
  let adminNotice = '';

  function renderAdminManagement(parent) {
    if (!currentSnapshot || currentSnapshot.adminRole !== 'owner') return;
    const section = el('section', 'admin-managers');
    section.appendChild(el('h2', 'admin-section-title', 'Administrator management'));
    section.appendChild(el('p', 'admin-managers-note', 'Owner access only. Add an existing Yapin Music account by email, or revoke an administrator below. The owner account is protected.'));
    const form = el('form', 'admin-add-form');
    const email = el('input', 'admin-add-email');
    email.type = 'email';
    email.required = true;
    email.maxLength = 254;
    email.placeholder = 'user@example.com';
    email.setAttribute('aria-label', 'Email address of the account to make admin');
    const submit = el('button', 'btn primary', 'Make admin');
    submit.type = 'submit';
    form.appendChild(email);
    form.appendChild(submit);
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!email.value.trim() || submit.disabled) return;
      submit.disabled = true;
      submit.textContent = 'Adding…';
      adminNotice = '';
      try {
        const result = await grantYapinAdmin(email.value.trim());
        if (result.admin && result.admin.alreadyOwner) {
          adminNotice = 'That account is already the protected owner.';
        } else {
          adminNotice = 'Admin access granted to ' + (result.admin.email || email.value.trim()) + '.';
        }
        await refresh();
      } catch (error) {
        adminNotice = error.message || 'Could not grant admin access.';
        render(currentSnapshot, '');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Make admin';
      }
    });
    section.appendChild(form);
    if (adminNotice) addNotice(section, adminNotice, /could not|no account|valid email|only the/i.test(adminNotice));

    const list = el('div', 'admin-manager-list');
    if (!adminUsers.length) {
      list.appendChild(el('div', 'community-empty', 'No administrator accounts were returned.'));
    }
    adminUsers.forEach(function (admin) {
      const row = el('article', 'admin-manager-row');
      const identity = el('div', 'admin-manager-identity');
      identity.appendChild(el('strong', null, admin.name || admin.email || 'Yapin user'));
      identity.appendChild(el('span', null, admin.email || 'No email'));
      const role = el('span', 'admin-role-pill role-' + admin.role, admin.role === 'owner' ? 'Owner' : 'Admin');
      identity.appendChild(role);
      row.appendChild(identity);
      if (admin.role !== 'owner') {
        row.appendChild(makeButton('Revoke admin', 'btn community-danger', async function () {
          if (!window.confirm('Remove admin access from ' + (admin.email || admin.name) + '?')) return;
          try {
            await removeYapinAdmin(admin.userId);
            adminNotice = 'Admin access removed from ' + (admin.email || admin.name) + '.';
            await refresh();
          } catch (error) {
            adminNotice = error.message || 'Could not remove admin access.';
            render(currentSnapshot, '');
          }
        }));
      }
      list.appendChild(row);
    });
    section.appendChild(list);
    parent.appendChild(section);
  }

  function render(snapshot, error) {
    if (!root) return;
    if (snapshot) currentSnapshot = snapshot;
    root.replaceChildren();
    const page = el('div', 'admin-page');
    const head = el('div', 'community-page-head');
    const title = el('div');
    title.appendChild(el('p', 'lb-eyebrow', 'YAPIN MUSIC CONTROL ROOM'));
    title.appendChild(el('h1', null, 'Admin dashboard'));
    title.appendChild(el('p', 'lede', 'Community overview and avatar decoration moderation.'));
    head.appendChild(title);
    head.appendChild(makeButton(loading ? 'Refreshing…' : 'Refresh data', 'btn', refresh));
    page.appendChild(head);

    if (error) {
      addNotice(page, error, true);
      page.appendChild(makeButton('Try again', 'btn primary', refresh));
      root.appendChild(page);
      return;
    }
    if (!snapshot) {
      addNotice(page, 'Loading admin data…');
      root.appendChild(page);
      return;
    }

    const stats = el('div', 'admin-stats');
    [
      ['Total users', snapshot.stats.totalUsers],
      ['Online now', snapshot.stats.onlineUsers],
      ['Waiting for review', snapshot.stats.pendingDecorations],
      ['Approved designs', snapshot.stats.approvedDecorations]
    ].forEach(function (stat) {
      const card = el('article', 'admin-stat-card');
      card.appendChild(el('span', null, stat[0]));
      card.appendChild(el('strong', null, Number(stat[1] || 0).toLocaleString()));
      stats.appendChild(card);
    });
    page.appendChild(stats);

    renderAdminManagement(page);

    page.appendChild(el('h2', 'admin-section-title', 'Decoration approval queue'));
    const queue = Array.isArray(snapshot.pending) ? snapshot.pending : [];
    if (!queue.length) {
      page.appendChild(el('div', 'community-empty', 'The review queue is clear. No pending decorations.'));
    } else {
      const list = el('div', 'admin-review-list');
      queue.forEach(function (item) {
        const card = el('article', 'admin-review-card');
        renderDecorationImage(card, item.image_data, item.name);
        const details = el('div', 'admin-review-details');
        details.appendChild(el('h3', null, item.name));
        details.appendChild(el('p', 'community-decor-creator', 'by ' + (item.creator_username || 'Unknown artist')));
        details.appendChild(el('p', 'community-decor-meta', 'Submitted ' + new Date(item.created_at).toLocaleString()));
        const actions = el('div', 'admin-review-actions');
        actions.appendChild(makeButton('Approve', 'btn primary', async function () {
          await moderate(item.id, 'approve');
        }));
        const reason = el('select', 'admin-reject-reason');
        reason.setAttribute('aria-label', 'Reason for turning down this decoration');
        [
          'Select a reason…',
          'Not original artwork',
          'Avatar safe area is not clear',
          'Not aligned with the avatar or cut off',
          'Not light at the bottom',
          'Too small or blurry',
          'Contains nudity, gore, or hate',
          'Other'
        ].forEach(function (label, index) {
          const option = el('option', null, label);
          option.value = index === 0 ? '' : label;
          reason.appendChild(option);
        });
        const note = el('input', 'admin-reject-note');
        note.type = 'text';
        note.maxLength = 130;
        note.placeholder = 'Optional note for the creator';
        const reject = makeButton('Turn down', 'btn community-danger', async function () {
          if (!reason.value) {
            addNotice(details, 'Choose a reason before turning this down.', true);
            return;
          }
          await moderate(item.id, 'reject', reason.value, note.value);
        });
        actions.appendChild(reason);
        actions.appendChild(note);
        actions.appendChild(reject);
        details.appendChild(actions);
        card.appendChild(details);
        list.appendChild(card);
      });
      page.appendChild(list);
    }
    root.appendChild(page);
  }

  async function moderate(decorationId, action, reason, note) {
    try {
      await moderateCommunityDecoration({ decorationId, action, reason, note });
      await refresh();
    } catch (error) {
      render(currentSnapshot, error.message || 'Could not update this submission.');
    }
  }

  async function refresh() {
    if (loading) return;
    loading = true;
    render(null, '');
    try {
      const snapshot = await getAdminDashboard();
      if (snapshot.adminRole === 'owner') {
        const result = await getYapinAdmins();
        adminUsers = result.admins || [];
      } else {
        adminUsers = [];
      }
      currentSnapshot = snapshot;
      render(snapshot, '');
    } catch (error) {
      render(null, error.message || 'Could not load the admin dashboard.');
    } finally {
      loading = false;
    }
  }

  return {
    init: function () {
      if (!initialized) initialized = true;
      refresh();
    }
  };
}

export function initPresenceAndAdminLink() {
  const adminLink = document.querySelector('[data-admin-panel-button]');
  const siteHeader = document.querySelector('.site-head');
  let currentUserId = '';
  let isAdmin = false;
  let adminCheckFor = '';

  function setAdminLink(visible) {
    isAdmin = Boolean(visible);
    if (adminLink) adminLink.hidden = !isAdmin;
    if (siteHeader) siteHeader.classList.toggle('admin-layout', isAdmin);
  }

  async function checkAdmin(userId) {
    if (!userId || adminCheckFor === userId) return;
    adminCheckFor = userId;
    try {
      await getAdminAccess();
      setAdminLink(true);
    } catch (error) {
      setAdminLink(false);
    }
  }

  async function heartbeat(userId) {
    if (!userId || document.visibilityState === 'hidden') return;
    try { await sendPresenceHeartbeat(); }
    catch (error) { /* Offline users simply age out of the five-minute presence window. */ }
  }

  function handleAccount(state) {
    const userId = state && state.user ? String(state.user.id || '') : '';
    if (!userId) {
      currentUserId = '';
      adminCheckFor = '';
      setAdminLink(false);
      return;
    }
    if (userId !== currentUserId) {
      currentUserId = userId;
      adminCheckFor = '';
      setAdminLink(false);
      heartbeat(userId);
      checkAdmin(userId);
    }
  }

  subscribeAccount(handleAccount);
  window.setInterval(function () { heartbeat(currentUserId); }, 60000);
  window.addEventListener('focus', function () {
    heartbeat(currentUserId);
    if (currentUserId) {
      adminCheckFor = '';
      checkAdmin(currentUserId);
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') heartbeat(currentUserId);
  });
}
