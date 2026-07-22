const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchBundle() {
  return new Promise((resolve, reject) => {
    https.get('https://vsnectar.web.app/static/js/main.37a29036.js', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function generateDataset() {
  console.log('Fetching JS bundle...');
  const text = await fetchBundle();

  const startMarker = 'songs:[';
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Could not find songs array marker');
  }

  const arrayStart = startIdx + 'songs:'.length;
  let depth = 0;
  let endIdx = arrayStart;
  for (let i = arrayStart; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const songsArrayCode = text.substring(arrayStart, endIdx);
  const rawSongs = new Function('return ' + songsArrayCode)();
  
  const tracks = [];
  
  rawSongs.forEach((song, songIndex) => {
    if (!song.link || !Array.isArray(song.link)) return;
    
    song.link.forEach((audio, audioIndex) => {
      if (!audio.linkaddress) return;
      
      const authorName = song.author && song.author !== 'undefined' ? song.author : 'Vaishnava Song';
      const singerName = audio.linkname && audio.linkname !== 'undefined' ? audio.linkname : 'Unknown Singer';

      tracks.push({
        id: `vsnectar:${songIndex}:${audioIndex}`,
        title: song.name,
        artist: `${authorName} (Sung by ${singerName})`,
        artwork: 'https://vsnectar.web.app/icon.png',
        duration: 0,
        source: 'vsnectar',
        streamUrl: audio.linkaddress,
      });
    });
  });

  const outputPath = path.join(__dirname, '../public/data/vsnectar.json');
  fs.writeFileSync(outputPath, JSON.stringify(tracks, null, 2));
  console.log(`Successfully generated dataset with ${tracks.length} tracks at ${outputPath}`);
}

generateDataset().catch(console.error);
