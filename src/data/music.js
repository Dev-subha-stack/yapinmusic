// Music catalog. Each band stores its country, genre, formation year, and song list.
export const BANDS = [
    { n: 'Queen', c: 'United Kingdom', g: 'Rock', f: 'Rock', y: 1970, s: [
      ['Bohemian Rhapsody', 1975, 'A Night at the Opera'], ['Another One Bites the Dust', 1980, 'The Game'], ['We Will Rock You', 1977, 'News of the World'],
      ["Don't Stop Me Now", 1979, 'Jazz'], ['Under Pressure', 1981, 'Hot Space'], ['Killer Queen', 1974, 'Sheer Heart Attack'], ['Radio Ga Ga', 1984, 'The Works'] ] },
    { n: 'Nirvana', c: 'USA', g: 'Grunge', f: 'Rock', y: 1987, s: [
      ['Smells Like Teen Spirit', 1991, 'Nevermind'], ['Come as You Are', 1991, 'Nevermind'], ['Lithium', 1991, 'Nevermind'], ['In Bloom', 1991, 'Nevermind'],
      ['Heart-Shaped Box', 1993, 'In Utero'], ['All Apologies', 1993, 'In Utero'], ['About a Girl', 1989, 'Bleach'] ] },
    { n: 'Metallica', c: 'USA', g: 'Heavy metal', f: 'Metal', y: 1981, s: [
      ['Enter Sandman', 1991, 'Metallica'], ['Nothing Else Matters', 1991, 'Metallica'], ['One', 1988, '...And Justice for All'], ['Master of Puppets', 1986, 'Master of Puppets'],
      ['Fade to Black', 1984, 'Ride the Lightning'], ['For Whom the Bell Tolls', 1984, 'Ride the Lightning'], ['The Unforgiven', 1991, 'Metallica'] ] },
    { n: 'Coldplay', c: 'United Kingdom', g: 'Pop rock', f: 'Pop', y: 1996, s: [
      ['Yellow', 2000, 'Parachutes'], ['Clocks', 2002, 'A Rush of Blood to the Head'], ['Fix You', 2005, 'X&Y'], ['The Scientist', 2002, 'A Rush of Blood to the Head'],
      ['Viva la Vida', 2008, 'Viva la Vida or Death and All His Friends'], ['Paradise', 2011, 'Mylo Xyloto'], ['Trouble', 2000, 'Parachutes'] ] },
    { n: 'Oasis', c: 'United Kingdom', g: 'Britpop', f: 'Rock', y: 1991, s: [
      ['Wonderwall', 1995, "(What's the Story) Morning Glory?"], ["Don't Look Back in Anger", 1995, "(What's the Story) Morning Glory?"], ['Champagne Supernova', 1995, "(What's the Story) Morning Glory?"],
      ['Supersonic', 1994, 'Definitely Maybe'], ['Live Forever', 1994, 'Definitely Maybe'], ['Some Might Say', 1995, "(What's the Story) Morning Glory?"], ['Stand by Me', 1997, 'Be Here Now'] ] },
    { n: 'Radiohead', c: 'United Kingdom', g: 'Alternative rock', f: 'Rock', y: 1985, s: [
      ['Creep', 1992, 'Pablo Honey'], ['Karma Police', 1997, 'OK Computer'], ['No Surprises', 1997, 'OK Computer'], ['Paranoid Android', 1997, 'OK Computer'],
      ['High and Dry', 1995, 'The Bends'], ['Fake Plastic Trees', 1995, 'The Bends'], ['Everything in Its Right Place', 2000, 'Kid A'] ] },
    { n: 'ABBA', c: 'Sweden', g: 'Pop', f: 'Pop', y: 1972, s: [
      ['Dancing Queen', 1976, 'Arrival'], ['Mamma Mia', 1975, 'ABBA'], ['Waterloo', 1974, 'Waterloo'], ['Take a Chance on Me', 1977, 'ABBA: The Album'],
      ['The Winner Takes It All', 1980, 'Super Trouper'], ['SOS', 1975, 'ABBA'], ['Money, Money, Money', 1976, 'Arrival'] ] },
    { n: 'Eagles', c: 'USA', g: 'Rock', f: 'Rock', y: 1971, s: [
      ['Hotel California', 1976, 'Hotel California'], ['Take It Easy', 1972, 'Eagles'], ['Desperado', 1973, 'Desperado'], ["Lyin' Eyes", 1975, 'One of These Nights'],
      ['One of These Nights', 1975, 'One of These Nights'], ['Tequila Sunrise', 1973, 'Desperado'], ['Life in the Fast Lane', 1976, 'Hotel California'] ] },
    { n: 'Pink Floyd', c: 'United Kingdom', g: 'Progressive rock', f: 'Rock', y: 1965, s: [
      ['Another Brick in the Wall', 1979, 'The Wall'], ['Comfortably Numb', 1979, 'The Wall'], ['Wish You Were Here', 1975, 'Wish You Were Here'], ['Time', 1973, 'The Dark Side of the Moon'],
      ['Money', 1973, 'The Dark Side of the Moon'], ['Shine On You Crazy Diamond', 1975, 'Wish You Were Here'], ['Hey You', 1979, 'The Wall'] ] },
    { n: 'Led Zeppelin', c: 'United Kingdom', g: 'Hard rock', f: 'Rock', y: 1968, s: [
      ['Stairway to Heaven', 1971, 'Led Zeppelin IV'], ['Whole Lotta Love', 1969, 'Led Zeppelin II'], ['Black Dog', 1971, 'Led Zeppelin IV'], ['Kashmir', 1975, 'Physical Graffiti'],
      ['Immigrant Song', 1970, 'Led Zeppelin III'], ['Rock and Roll', 1971, 'Led Zeppelin IV'], ['Ramble On', 1969, 'Led Zeppelin II'] ] },
    { n: 'Iron Maiden', c: 'United Kingdom', g: 'Heavy metal', f: 'Metal', y: 1975, s: [
      ['The Trooper', 1983, 'Piece of Mind'], ['Run to the Hills', 1982, 'The Number of the Beast'], ['The Number of the Beast', 1982, 'The Number of the Beast'], ['Fear of the Dark', 1992, 'Fear of the Dark'],
      ['Hallowed Be Thy Name', 1982, 'The Number of the Beast'], ['Aces High', 1984, 'Powerslave'], ['Powerslave', 1984, 'Powerslave'] ] },
    { n: "Guns N' Roses", c: 'USA', g: 'Hard rock', f: 'Rock', y: 1985, s: [
      ["Sweet Child o' Mine", 1987, 'Appetite for Destruction'], ['Welcome to the Jungle', 1987, 'Appetite for Destruction'], ['Paradise City', 1987, 'Appetite for Destruction'], ['November Rain', 1991, 'Use Your Illusion I'],
      ["Don't Cry", 1991, 'Use Your Illusion I'], ['Patience', 1988, "G N' R Lies"], ['You Could Be Mine', 1991, 'Use Your Illusion II'] ] },
    { n: 'Linkin Park', c: 'USA', g: 'Nu metal', f: 'Metal', y: 1996, s: [
      ['In the End', 2000, 'Hybrid Theory'], ['Numb', 2003, 'Meteora'], ['Crawling', 2000, 'Hybrid Theory'], ['One Step Closer', 2000, 'Hybrid Theory'],
      ['Breaking the Habit', 2003, 'Meteora'], ["What I've Done", 2007, 'Minutes to Midnight'], ['Faint', 2003, 'Meteora'] ] },
    { n: 'Green Day', c: 'USA', g: 'Punk rock', f: 'Punk', y: 1987, s: [
      ['Basket Case', 1994, 'Dookie'], ['American Idiot', 2004, 'American Idiot'], ['Boulevard of Broken Dreams', 2004, 'American Idiot'], ['Good Riddance (Time of Your Life)', 1997, 'Nimrod'],
      ['When I Come Around', 1994, 'Dookie'], ['Wake Me Up When September Ends', 2004, 'American Idiot'], ['Holiday', 2004, 'American Idiot'] ] },
    { n: 'The Beatles', c: 'United Kingdom', g: 'Rock', f: 'Rock', y: 1960, s: [
      ['Hey Jude', 1968, 'Non-album single'], ['Let It Be', 1970, 'Let It Be'], ['Yesterday', 1965, 'Help!'], ['Come Together', 1969, 'Abbey Road'],
      ['Here Comes the Sun', 1969, 'Abbey Road'], ['Help!', 1965, 'Help!'], ['Eleanor Rigby', 1966, 'Revolver'] ] },
    { n: 'The Doors', c: 'USA', g: 'Rock', f: 'Rock', y: 1965, s: [
      ['Light My Fire', 1967, 'The Doors'], ['Riders on the Storm', 1971, 'L.A. Woman'], ['Break On Through', 1967, 'The Doors'], ['People Are Strange', 1967, 'Strange Days'],
      ['Hello, I Love You', 1968, 'Waiting for the Sun'], ['L.A. Woman', 1971, 'L.A. Woman'], ['Roadhouse Blues', 1970, 'Morrison Hotel'] ] },
    { n: 'Arctic Monkeys', c: 'United Kingdom', g: 'Indie rock', f: 'Rock', y: 2002, s: [
      ['Do I Wanna Know?', 2013, 'AM'], ['R U Mine?', 2012, 'AM'], ['I Bet You Look Good on the Dancefloor', 2005, "Whatever People Say I Am, That's What I'm Not"], ['Mardy Bum', 2006, "Whatever People Say I Am, That's What I'm Not"],
      ['505', 2007, 'Favourite Worst Nightmare'], ['Fluorescent Adolescent', 2007, 'Favourite Worst Nightmare'], ['Arabella', 2013, 'AM'] ] },
    { n: 'The Killers', c: 'USA', g: 'Indie rock', f: 'Rock', y: 2001, s: [
      ['Mr. Brightside', 2004, 'Hot Fuss'], ['Somebody Told Me', 2004, 'Hot Fuss'], ['When You Were Young', 2006, "Sam's Town"], ["All These Things That I've Done", 2004, 'Hot Fuss'],
      ['Human', 2008, 'Day & Age'], ['Smile Like You Mean It', 2004, 'Hot Fuss'], ['Read My Mind', 2006, "Sam's Town"] ] },
    { n: 'Daft Punk', c: 'France', g: 'Electronic', f: 'Electronic', y: 1993, s: [
      ['Get Lucky', 2013, 'Random Access Memories'], ['One More Time', 2000, 'Discovery'], ['Harder, Better, Faster, Stronger', 2001, 'Discovery'], ['Around the World', 1997, 'Homework'],
      ['Digital Love', 2001, 'Discovery'], ['Instant Crush', 2013, 'Random Access Memories'], ['Da Funk', 1995, 'Homework'] ] },
    { n: 'Legião Urbana', c: 'Brazil', g: 'Rock', f: 'Rock', y: 1982, s: [
      ['Tempo Perdido', 1986, 'Dois'], ['Pais e Filhos', 1989, 'As Quatro Estações'], ['Eduardo e Mônica', 1986, 'Dois'], ['Faroeste Caboclo', 1987, 'Que País É Este'],
      ['Será', 1985, 'Legião Urbana'], ['Quase Sem Querer', 1986, 'Dois'], ['Há Tempos', 1989, 'As Quatro Estações'], ['Vento no Litoral', 1989, 'As Quatro Estações'] ] },
    { n: 'Titãs', c: 'Brazil', g: 'Rock', f: 'Rock', y: 1982, s: [
      ['Epitáfio', 2001, 'A Melhor Banda de Todos os Tempos da Última Semana'], ['Sonífera Ilha', 1984, 'Titãs'], ['Comida', 1987, 'Jesus Não Tem Dentes no País dos Banguelas'], ['Flores', 1989, 'Õ Blésq Blom'],
      ['Polícia', 1986, 'Cabeça Dinossauro'], ['Bichos Escrotos', 1986, 'Cabeça Dinossauro'], ['Cabeça Dinossauro', 1986, 'Cabeça Dinossauro'] ] },
    { n: 'Los Hermanos', c: 'Brazil', g: 'Indie rock', f: 'Rock', y: 1997, s: [
      ['Anna Júlia', 1999, 'Los Hermanos'], ['Veja Bem Meu Bem', 1999, 'Los Hermanos'], ['Sentimental', 1999, 'Los Hermanos'], ['O Vencedor', 2001, 'Bloco do Eu Sozinho'],
      ['Todo Carnaval Tem Seu Fim', 2001, 'Bloco do Eu Sozinho'], ['Conversa de Botas Batidas', 2003, 'Ventura'] ] },
    { n: 'Sepultura', c: 'Brazil', g: 'Heavy metal', f: 'Metal', y: 1984, s: [
      ['Roots Bloody Roots', 1996, 'Roots'], ['Refuse/Resist', 1993, 'Chaos A.D.'], ['Territory', 1993, 'Chaos A.D.'], ['Arise', 1991, 'Arise'],
      ['Ratamahatta', 1996, 'Roots'], ['Dead Embryonic Cells', 1991, 'Arise'], ['Inner Self', 1989, 'Beneath the Remains'] ] },
    { n: 'Foo Fighters', c: 'USA', g: 'Rock', f: 'Rock', y: 1994, s: [
      ['Everlong', 1997, 'The Colour and the Shape'], ['Learn to Fly', 1999, 'There Is Nothing Left to Lose'], ['The Pretender', 2007, 'Echoes, Silence, Patience & Grace'], ['Best of You', 2005, 'In Your Honor'],
      ['My Hero', 1997, 'The Colour and the Shape'], ['Times Like These', 2002, 'One by One'], ['Monkey Wrench', 1997, 'The Colour and the Shape'] ] },
    { n: 'AC/DC', c: 'Australia', g: 'Hard rock', f: 'Rock', y: 1973, s: [
      ['Back in Black', 1980, 'Back in Black'], ['Highway to Hell', 1979, 'Highway to Hell'], ['Thunderstruck', 1990, 'The Razors Edge'], ['You Shook Me All Night Long', 1980, 'Back in Black'],
      ['T.N.T.', 1975, 'T.N.T.'], ['Hells Bells', 1980, 'Back in Black'], ['Dirty Deeds Done Dirt Cheap', 1976, 'Dirty Deeds Done Dirt Cheap'] ] },
    { n: 'Imagine Dragons', c: 'USA', g: 'Pop rock', f: 'Pop', y: 2008, s: [
      ['Believer', 2017, 'Evolve'], ['Radioactive', 2012, 'Night Visions'], ['Thunder', 2017, 'Evolve'], ['Demons', 2012, 'Night Visions'],
      ["It's Time", 2012, 'Night Visions'], ['Whatever It Takes', 2017, 'Evolve'], ['Bad Liar', 2018, 'Origins'] ] },
    { n: 'Maroon 5', c: 'USA', g: 'Pop rock', f: 'Pop', y: 1994, s: [
      ['Sugar', 2014, 'V'], ['Moves Like Jagger', 2011, 'Hands All Over'], ['This Love', 2002, 'Songs About Jane'], ['She Will Be Loved', 2002, 'Songs About Jane'],
      ['Girls Like You', 2018, 'Red Pill Blues'], ['Payphone', 2012, 'Overexposed'], ['Animals', 2014, 'V'], ['Memories', 2019, 'Jordi'] ] },
    { n: 'Spice Girls', c: 'United Kingdom', g: 'Pop', f: 'Pop', y: 1994, s: [
      ['Wannabe', 1996, 'Spice'], ['Spice Up Your Life', 1997, 'Spiceworld'], ['Stop', 1997, 'Spiceworld'], ["Say You'll Be There", 1996, 'Spice'],
      ['2 Become 1', 1996, 'Spice'], ['Viva Forever', 1997, 'Spiceworld'], ['Mama', 1996, 'Spice'] ] },
    { n: 'Ramones', c: 'USA', g: 'Punk rock', f: 'Punk', y: 1974, s: [
      ['Blitzkrieg Bop', 1976, 'Ramones'], ['I Wanna Be Sedated', 1978, 'Road to Ruin'], ['Sheena Is a Punk Rocker', 1977, 'Rocket to Russia'], ['Rockaway Beach', 1977, 'Rocket to Russia'],
      ["Rock 'n' Roll High School", 1979, 'End of the Century'], ['Pet Sematary', 1989, 'Brain Drain'], ['Beat on the Brat', 1976, 'Ramones'], ['Judy Is a Punk', 1976, 'Ramones'] ] },
    { n: 'The Clash', c: 'United Kingdom', g: 'Punk rock', f: 'Punk', y: 1976, s: [
      ['London Calling', 1979, 'London Calling'], ['Should I Stay or Should I Go', 1982, 'Combat Rock'], ['Rock the Casbah', 1982, 'Combat Rock'], ['Train in Vain', 1979, 'London Calling'],
      ['Spanish Bombs', 1979, 'London Calling'], ['Complete Control', 1977, 'Non-album single'], ['White Riot', 1977, 'The Clash'], ['Clampdown', 1979, 'London Calling'] ] },
    { n: 'The Cure', c: 'United Kingdom', g: 'Post-punk', f: 'Rock', y: 1976, s: [
      ["Friday I'm in Love", 1992, 'Wish'], ['Just Like Heaven', 1987, 'Kiss Me, Kiss Me, Kiss Me'], ["Boys Don't Cry", 1979, 'Non-album single'], ['Lovesong', 1989, 'Disintegration'],
      ['Pictures of You', 1989, 'Disintegration'], ['In Between Days', 1985, 'The Head on the Door'], ['Close to Me', 1985, 'The Head on the Door'], ['A Forest', 1980, 'Seventeen Seconds'] ] },
    { n: 'Depeche Mode', c: 'United Kingdom', g: 'Synth-pop', f: 'Pop', y: 1980, s: [
      ['Enjoy the Silence', 1990, 'Violator'], ['Personal Jesus', 1989, 'Violator'], ["Just Can't Get Enough", 1981, 'Speak & Spell'], ['Never Let Me Down Again', 1987, 'Music for the Masses'],
      ['People Are People', 1984, 'Some Great Reward'], ['Policy of Truth', 1990, 'Violator'], ['Everything Counts', 1983, 'Construction Time Again'], ['World in My Eyes', 1990, 'Violator'] ] },
    { n: 'Roxette', c: 'Sweden', g: 'Pop rock', f: 'Pop', y: 1986, s: [
      ['It Must Have Been Love', 1990, 'Pretty Woman soundtrack'], ['The Look', 1988, 'Look Sharp!'], ['Listen to Your Heart', 1988, 'Look Sharp!'], ['Joyride', 1991, 'Joyride'],
      ['Dangerous', 1989, 'Look Sharp!'], ['Fading Like a Flower', 1991, 'Joyride'], ['Dressed for Success', 1988, 'Look Sharp!'] ] },
    { n: 'Evanescence', c: 'USA', g: 'Alternative metal', f: 'Metal', y: 1995, s: [
      ['Bring Me to Life', 2003, 'Fallen'], ['My Immortal', 2003, 'Fallen'], ['Going Under', 2003, 'Fallen'], ["Everybody's Fool", 2003, 'Fallen'],
      ["Call Me When You're Sober", 2006, 'The Open Door'], ['Sweet Sacrifice', 2007, 'The Open Door'], ['Imaginary', 2003, 'Fallen'] ] },
    { n: 'Paramore', c: 'USA', g: 'Pop punk', f: 'Punk', y: 2004, s: [
      ['Misery Business', 2007, 'Riot!'], ['Decode', 2008, 'Twilight soundtrack'], ['Still into You', 2013, 'Paramore'], ["Ain't It Fun", 2013, 'Paramore'],
      ['The Only Exception', 2009, 'Brand New Eyes'], ['Crushcrushcrush', 2007, 'Riot!'], ["That's What You Get", 2007, 'Riot!'], ['Hard Times', 2017, 'After Laughter'] ] },
    { n: 'My Chemical Romance', c: 'USA', g: 'Alternative rock', f: 'Rock', y: 2001, s: [
      ['Welcome to the Black Parade', 2006, 'The Black Parade'], ["I'm Not Okay (I Promise)", 2004, 'Three Cheers for Sweet Revenge'], ['Helena', 2005, 'Three Cheers for Sweet Revenge'], ['Teenagers', 2007, 'The Black Parade'],
      ['Famous Last Words', 2006, 'The Black Parade'], ['Dead!', 2006, 'The Black Parade'], ['Na Na Na', 2010, 'Danger Days: The True Lives of the Fabulous Killjoys'] ] },
    { n: 'Red Hot Chili Peppers', c: 'USA', g: 'Funk rock', f: 'Rock', y: 1983, s: [
      ['Californication', 1999, 'Californication'], ['Under the Bridge', 1991, 'Blood Sugar Sex Magik'], ['Scar Tissue', 1999, 'Californication'], ['Otherside', 1999, 'Californication'],
      ['By the Way', 2002, 'By the Way'], ["Can't Stop", 2002, 'By the Way'], ['Dani California', 2006, 'Stadium Arcadium'], ['Give It Away', 1991, 'Blood Sugar Sex Magik'] ] },
    { n: 'Gorillaz', c: 'United Kingdom', g: 'Alternative', f: 'Electronic', y: 1998, s: [
      ['Feel Good Inc.', 2005, 'Demon Days'], ['Clint Eastwood', 2001, 'Gorillaz'], ['Dare', 2005, 'Demon Days'], ['19-2000', 2001, 'Gorillaz'],
      ['On Melancholy Hill', 2010, 'Plastic Beach'], ['Rhinestone Eyes', 2010, 'Plastic Beach'], ['Stylo', 2010, 'Plastic Beach'] ] },
    { n: 'Blackpink', c: 'South Korea', g: 'K-pop', f: 'Pop', y: 2016, s: [
      ['How You Like That', 2020, 'The Album'], ['DDU-DU DDU-DU', 2018, 'Square Up'], ['Kill This Love', 2019, 'Kill This Love'], ['Ice Cream', 2020, 'The Album'],
      ['Pink Venom', 2022, 'Born Pink'], ['Shut Down', 2022, 'Born Pink'], ['Lovesick Girls', 2020, 'The Album'], ['Boombayah', 2016, 'Square One'] ] },
    { n: 'Muse', c: 'United Kingdom', g: 'Alternative rock', f: 'Rock', y: 1994, s: [
      ['Uprising', 2009, 'The Resistance'], ['Supermassive Black Hole', 2006, 'Black Holes and Revelations'], ['Starlight', 2006, 'Black Holes and Revelations'], ['Time Is Running Out', 2003, 'Absolution'],
      ['Hysteria', 2003, 'Absolution'], ['Madness', 2012, 'The 2nd Law'], ['Plug In Baby', 2001, 'Origin of Symmetry'], ['Knights of Cydonia', 2006, 'Black Holes and Revelations'] ] },
    { n: 'Aerosmith', c: 'USA', g: 'Hard rock', f: 'Rock', y: 1970, s: [
      ['Dream On', 1973, 'Aerosmith'], ['Walk This Way', 1975, 'Toys in the Attic'], ["I Don't Want to Miss a Thing", 1998, 'Armageddon soundtrack'], ['Crazy', 1993, 'Get a Grip'],
      ["Cryin'", 1993, 'Get a Grip'], ['Sweet Emotion', 1975, 'Toys in the Attic'], ["Janie's Got a Gun", 1989, 'Pump'], ['Love in an Elevator', 1989, 'Pump'] ] },
    { n: 'Scorpions', c: 'Germany', g: 'Hard rock', f: 'Rock', y: 1965, s: [
      ['Wind of Change', 1990, 'Crazy World'], ['Still Loving You', 1984, 'Love at First Sting'], ['Rock You Like a Hurricane', 1984, 'Love at First Sting'], ['Send Me an Angel', 1990, 'Crazy World'],
      ['No One Like You', 1982, 'Blackout'], ['Big City Nights', 1984, 'Love at First Sting'], ['Blackout', 1982, 'Blackout'] ] },
    { n: 'Journey', c: 'USA', g: 'Rock', f: 'Rock', y: 1973, s: [
      ["Don't Stop Believin'", 1981, 'Escape'], ['Any Way You Want It', 1980, 'Departure'], ['Faithfully', 1983, 'Frontiers'], ['Separate Ways (Worlds Apart)', 1983, 'Frontiers'],
      ['Open Arms', 1981, 'Escape'], ['Wheel in the Sky', 1978, 'Infinity'], ['Lights', 1978, 'Infinity'], ["Lovin', Touchin', Squeezin'", 1979, 'Evolution'] ] },
    { n: 'Pearl Jam', c: 'USA', g: 'Grunge', f: 'Rock', y: 1990, s: [
      ['Alive', 1991, 'Ten'], ['Even Flow', 1991, 'Ten'], ['Jeremy', 1991, 'Ten'], ['Black', 1991, 'Ten'],
      ['Daughter', 1993, 'Vs.'], ['Better Man', 1994, 'Vitalogy'], ['Given to Fly', 1998, 'Yield'], ['Last Kiss', 1999, 'Non-album single'] ] },
  

    { n: 'A. R. Rahman', c: 'India', g: 'Film score · Indian fusion · Electronic', f: 'Pop', y: 1992, type: 'artist', origin: 'Chennai, Tamil Nadu', languages: 'Tamil, Hindi, Telugu, Malayalam, English', aliases: ['AR Rahman', 'A R Rahman', 'Allah Rakha Rahman', 'ए आर रहमान', 'ஏ. ஆர். ரகுமான்'], bio: 'Indian composer, producer, singer and songwriter known for blending Indian classical and folk traditions with electronic, orchestral and global sounds. His major film-composing debut was Roja in 1992.', s: [
      ['Chaiyya Chaiyya', 1998, 'Dil Se..'], ['Dil Se Re', 1998, 'Dil Se..'], ['Tere Bina', 2007, 'Guru'], ['Jai Ho', 2008, 'Slumdog Millionaire'], ['Kun Faya Kun', 2011, 'Rockstar'], ['Maa Tujhe Salaam', 1997, 'Vande Mataram'], ['Muqabla', 1994, 'Kadhalan'] ] },
    { n: 'Arijit Singh', c: 'India', g: 'Playback · Pop · Sufi', f: 'Pop', y: 2005, type: 'artist', origin: 'Jiaganj, Murshidabad, West Bengal', languages: 'Hindi, Bengali and other Indian languages', aliases: ['Arijit', 'অরিজিৎ সিং', 'अरिजीत सिंह'], bio: 'Indian playback singer from Jiaganj in West Bengal. He trained in Indian classical music and became widely known for expressive romantic, devotional and Sufi-influenced songs, including Tum Hi Ho.', s: [
      ['Tum Hi Ho', 2013, 'Aashiqui 2'], ['Phir Le Aya Dil', 2012, 'Barfi!'], ['Agar Tum Saath Ho', 2015, 'Tamasha'], ['Channa Mereya', 2016, 'Ae Dil Hai Mushkil'], ['Khairiyat', 2019, 'Chhichhore'], ['Kesariya', 2022, 'Brahmastra: Part One – Shiva'], ['Sajni', 2024, 'Laapataa Ladies'] ] },
    { n: 'Shreya Ghoshal', c: 'India', g: 'Playback · Classical · Pop', f: 'Pop', y: 2002, type: 'artist', origin: 'Berhampore, West Bengal', languages: 'Hindi, Bengali, Tamil, Telugu, Malayalam and more', aliases: ['Shreya', 'শ্রেয়া ঘোষাল', 'श्रेय घोषाल'], bio: 'Indian playback singer whose career took off with Devdas in 2002. Her repertoire spans film songs, romantic ballads, classical-influenced music and recordings in many Indian languages.', s: [
      ['Bairi Piya', 2002, 'Devdas'], ['Dola Re Dola', 2002, 'Devdas'], ['Teri Ore', 2008, 'Singh Is Kinng'], ['Saans', 2012, 'Jab Tak Hai Jaan'], ['Sun Raha Hai (Female)', 2013, 'Aashiqui 2'], ['Deewani Mastani', 2015, 'Bajirao Mastani'], ['Param Sundari', 2021, 'Mimi'] ] },
    { n: 'Lata Mangeshkar', c: 'India', g: 'Playback · Indian classical · Ghazal', f: 'Pop', y: 1942, type: 'artist', origin: 'Indore, Madhya Pradesh', languages: 'Hindi and many Indian languages', aliases: ['Lata', 'Nightingale of India', 'लता मंगेशकर', 'লতা মঙ্গেশকর'], bio: 'Legendary Indian playback singer whose recording career began in the early 1940s. Her voice became part of Hindi cinema across generations, and she also recorded extensively in regional Indian languages.', s: [
      ['Ajeeb Dastan Hai Yeh', 1960, 'Dil Apna Aur Preet Parai'], ['Pyar Kiya To Darna Kya', 1960, 'Mughal-e-Azam'], ['Aap Ki Nazron Ne Samjha', 1962, 'Anpadh'], ['Lag Ja Gale', 1964, 'Woh Kaun Thi?'], ['Tere Bina Zindagi Se', 1975, 'Aandhi'], ['Luka Chuppi', 2006, 'Rang De Basanti'] ] },
    { n: 'Kishore Kumar', c: 'India', g: 'Playback · Pop · Film music', f: 'Pop', y: 1948, type: 'artist', origin: 'Khandwa, Madhya Pradesh', languages: 'Hindi, Bengali and other Indian languages', aliases: ['Kishore', 'किशोर कुमार', 'কিশোর কুমার'], bio: 'Indian singer, actor and composer celebrated for his expressive playback singing, yodelling and comic performances. His best-known film songs became staples of Hindi popular music in the 1960s and 1970s.', s: [
      ['Mere Sapno Ki Rani', 1969, 'Aradhana'], ['Roop Tera Mastana', 1969, 'Aradhana'], ['Yeh Shaam Mastani', 1971, 'Kati Patang'], ['Zindagi Ek Safar', 1971, 'Andaz'], ['Chingari Koi Bhadke', 1972, 'Amar Prem'], ['Pal Pal Dil Ke Paas', 1973, 'Blackmail'], ['O Saathi Re', 1978, 'Muqaddar Ka Sikandar'] ] },
    { n: 'Diljit Dosanjh', c: 'India', g: 'Punjabi pop · Bhangra · Hip-hop', f: 'Pop', y: 2004, type: 'artist', origin: 'Dosanjh Kalan, Punjab', languages: 'Punjabi, Hindi and English', aliases: ['Diljit', 'ਦਿਲਜੀਤ ਦੋਸਾਂਝ', 'दिलजीत दोसांझ'], bio: 'Punjabi singer and actor known for taking Punjabi pop and bhangra to a wide international audience, while also recording Hindi film songs and contemporary pop collaborations.', s: [
      ['Proper Patola', 2013, 'Single'], ['Do You Know', 2016, 'Con.Fi.Den.Tial'], ['G.O.A.T.', 2020, 'G.O.A.T.'], ['Born to Shine', 2021, 'MoonChild Era'], ['Lover', 2021, 'MoonChild Era'], ['Hass Hass', 2023, 'Single'], ['Naina', 2024, 'Crew'] ] },
    { n: 'Anuv Jain', c: 'India', g: 'Indie pop · Acoustic · Singer-songwriter', f: 'Pop', y: 2012, type: 'artist', origin: 'Ludhiana, Punjab', languages: 'Hindi and Urdu', aliases: ['Anuv', 'अनुव जैन', 'ਅਨੁਵ ਜੈਨ'], bio: 'Indian singer-songwriter known for intimate, guitar- and ukulele-led indie pop. His songs often focus on love, longing and heartbreak, with Husn and Jo Tum Mere Ho among his best-known releases.', s: [
      ['Baarishein', 2018, 'Single'], ['Alag Aasmaan', 2020, 'Single'], ['Gul', 2021, 'Single'], ['Mazaak', 2022, 'Single'], ['Husn', 2023, 'Single'], ['Jo Tum Mere Ho', 2024, 'Single'], ['Inaam', 2025, 'Single'] ] },
    { n: 'Prateek Kuhad', c: 'India', g: 'Indie folk · Pop rock', f: 'Pop', y: 2015, type: 'artist', origin: 'Jaipur, Rajasthan', languages: 'Hindi and English', aliases: ['Prateek', 'प्रतीक कुहाड़'], bio: 'Jaipur-born Indian singer-songwriter whose minimal indie folk and pop songs move between Hindi and English. His releases include the album In Tokens & Charms and the internationally noticed cold/mess.', s: [
      ['Co2', 2013, 'Single'], ['Tune Kaha', 2016, 'Raat Raazi'], ['cold/mess', 2018, 'cold/mess'], ['Kasoor', 2018, 'cold/mess'], ['With You / With Me', 2020, 'The Way That Lovers Do'], ['Just a Word', 2022, 'The Way That Lovers Do'] ] },
    { n: 'Ritviz', c: 'India', g: 'Electronic · Hindustani fusion · Pop', f: 'Electronic', y: 2017, type: 'artist', origin: 'Darbhanga, Bihar', languages: 'Hindi and instrumental/electronic', aliases: ['Ritviz Srivastava', 'रित्विज़'], bio: 'Indian singer, DJ and electronic music producer who blends Hindustani classical influences with bass-heavy electronic production. Udd Gaye brought his distinctive sound to a national audience in 2017.', s: [
      ['Udd Gaye', 2017, 'Single'], ['Barso', 2018, 'Single'], ['Sage', 2018, 'Single'], ['Jeet', 2019, 'Single'], ['Liggi', 2019, 'Single'], ['Mehrbaan', 2020, 'Single'], ['Thandi Hawa', 2023, 'Single'] ] },
    { n: 'The Local Train', c: 'India', g: 'Hindi rock · Alternative rock', f: 'Rock', y: 2008, type: 'band', origin: 'Chandigarh; later based in New Delhi', languages: 'Hindi', aliases: ['Local Train', 'TLT', 'द लोकल ट्रेन'], bio: 'Indian Hindi-rock band formed in Chandigarh and later based in New Delhi. Their albums Aalas Ka Pedh (2015) and Vaaqif (2018) helped bring independent Hindi rock to a wide audience.', s: [
      ['Choo Lo', 2015, 'Aalas Ka Pedh'], ['Aaftaab', 2015, 'Aalas Ka Pedh'], ['Khudi', 2017, 'Single'], ['Dil Mere', 2018, 'Vaaqif'], ['Mizaaj', 2018, 'Vaaqif'], ['Vaaqif', 2018, 'Vaaqif'], ['Tu Hai Kahaan', 2024, 'Single'] ] },
    { n: 'Indian Ocean', c: 'India', g: 'Fusion rock · Folk rock', f: 'Rock', y: 1990, type: 'band', origin: 'New Delhi', languages: 'Hindi and regional Indian languages', aliases: ['Indian Ocean band', 'इंडियन ओशन'], bio: 'Pioneering Indian fusion-rock band associated with blending rock arrangements with Indian folk and classical influences. Their long-running catalogue includes the albums Kandisa and Desert Rain, as well as music for films.', s: [
      ['Kandisa', 2000, 'Kandisa'], ['Ma Rewa', 2000, 'Kandisa'], ['Jhini', 2000, 'Kandisa'], ['Bandeh', 2004, 'Black Friday'], ['Des Mera', 2004, 'Black Friday'], ['Tu Kisi Rail Si', 2015, 'Masaan'], ['Bhor', 2015, 'Tandanu'] ] },
    { n: 'When Chai Met Toast', c: 'India', g: 'Indie folk · Pop · Alternative rock', f: 'Rock', y: 2016, type: 'band', origin: 'Kochi, Kerala', languages: 'English, Malayalam and Hindi', aliases: ['WCMT', 'WhenChaiMetToast'], bio: 'Kochi-based Indian folk/pop quartet known for warm melodies, multilingual songwriting and a blend of indie folk and alternative rock. Their debut EP Joy of Little Things arrived in 2017.', s: [
      ['Joy of Little Things', 2017, 'Joy of Little Things'], ['Firefly', 2017, 'Joy of Little Things'], ['Believe', 2018, 'Believe'], ['Khoj', 2018, 'Believe'], ['Oh My Love', 2019, 'Single'], ['When We Feel Young', 2021, 'When We Feel Young'], ['Dreamland', 2024, 'Single'] ] },
    { n: 'Seedhe Maut', c: 'India', g: 'Hindi hip-hop · Rap', f: 'Hip-hop', y: 2015, type: 'band', origin: 'New Delhi', languages: 'Hindi and English', aliases: ['Calm and Encore', 'CALM & ENCORE', 'सीधे मौत'], bio: 'Delhi-based Hindi hip-hop duo CALM and Encore ABJ, known for sharp lyricism, energetic production and projects including Bayaan, Nayaab and Lunch Break.', s: [
      ['Maina', 2018, 'Bayaan'], ['101', 2019, 'Single'], ['Namastute', 2022, 'Nayaab'], ['Nanchaku', 2022, 'Nayaab'], ['Shaktimaan', 2022, 'Nayaab'], ['Lunch Break', 2023, 'Lunch Break'], ['Do Guna', 2023, 'Lunch Break'] ] },
    { n: 'Papon', c: 'India', g: 'Assamese folk · Folk fusion · Playback', f: 'Folk', y: 2004, type: 'artist', origin: 'Assam, India', languages: 'Assamese, Hindi and other Indian languages', aliases: ['Angaraag Mahanta', 'পাপন'], bio: 'Assamese singer-songwriter Angaraag Mahanta, widely known as Papon, grew up in a family rooted in Assamese folk and classical music. He blends regional folk sounds with contemporary arrangements and Hindi film songs.', s: [
      ['Sajana', 2004, "Let's Enjoy"], ['Jiyein Kyun', 2011, 'Dum Maaro Dum'], ['Kyon', 2012, 'Barfi!'], ['Kaun Mera', 2013, 'Special 26'], ['Moh Moh Ke Dhaage', 2015, 'Dum Laga Ke Haisha'], ['Humnava', 2015, 'Hamari Adhuri Kahani'], ['Bulleya', 2016, 'Sultan'] ] },
    { n: 'Zubeen Garg', c: 'India', g: 'Assamese · Bengali · Hindi · Folk pop', f: 'Pop', y: 1992, type: 'artist', origin: 'Tura, Meghalaya; closely associated with Assam', languages: 'Assamese, Bengali, Hindi and many other languages', aliases: ['Zubeen', 'জুবিন গাৰ্গ', 'জুবিন গার্গ'], bio: 'Assamese singer, composer and multi-instrumentalist whose work connected Assamese, Bengali and Hindi music. His career began with the Assamese album Anamika in 1992 and included the Hindi hit Ya Ali.', s: [
      ['Ya Ali', 2006, 'Gangster'], ['Jaane Kya Chahe Mann', 2006, 'Pyaar Ke Side Effects'], ['Dil Tu Hi Bataa', 2013, 'Krrish 3'], ['Mayabini', 2001, 'Anamika'], ['Pakhi', 2014, 'Single'], ['Anamika', 1992, 'Anamika'] ] },
    { n: 'Bhupen Hazarika', c: 'India', g: 'Assamese folk · Indian folk · Film music', f: 'Folk', y: 1950, type: 'artist', origin: 'Sadiya, Assam', languages: 'Assamese, Bengali, Hindi and other languages', aliases: ['Bhupen Da', 'ভূপেন হাজৰিকা', 'भूपेन हजारिका'], bio: 'Assamese singer, lyricist, composer and filmmaker whose work drew on the folk traditions of Assam and Northeast India. He also created music in Bengali and Hindi and wrote songs centred on humanity and social themes.', s: [
      ['Bistirno Parore', 1970, 'Assamese recordings'], ['Manuhe Manuhor Babe', 1980, 'Assamese recordings'], ['Moi Eti Jajabor', 1970, 'Assamese recordings'], ['Ganga', 1993, 'Rudaali'], ['Dil Hoom Hoom Kare', 1993, 'Rudaali'], ['O Ganga Behti Ho Kyun', 1993, 'Rudaali'] ] }

  ];