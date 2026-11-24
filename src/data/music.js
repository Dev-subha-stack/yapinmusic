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
      ['Daughter', 1993, 'Vs.'], ['Better Man', 1994, 'Vitalogy'], ['Given to Fly', 1998, 'Yield'], ['Last Kiss', 1999, 'Non-album single'] ] }
  ];;
