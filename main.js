import { createTransport } from './transport.js?v=music-only-1';

const sideLabel = document.querySelector('#side');
const statusLabel = document.querySelector('#status');
const elapsed = document.querySelector('#time');
const track = document.querySelector('#track');
const artist = document.querySelector('#artist');
let tapeTracks;
const sideUploads = document.querySelectorAll('[data-upload-side]');
function setUploadBusy(busy) {
  for (const label of sideUploads) label.querySelector('input').disabled = busy;
}
const deck = document.querySelector('.cassette');
const playPause = document.querySelector('#play-pause');
let playbackStatus = 'Paused';

let requestedSide;
let flipGeneration = 0;

function showSide(side) {
  sideLabel.textContent = `Side ${side}`;
  sideLabel.dataset.side = side;
  track.textContent = tapeTracks[side].title;
  artist.textContent = tapeTracks[side].artist;
  for (const label of sideUploads) label.hidden = label.dataset.uploadSide !== side;
}

async function turnCassette(side) {
  const generation = ++flipGeneration;
  deck.getAnimations().forEach(animation => animation.cancel());
  deck.style.transform = '';
  setUploadBusy(true);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showSide(side);
    setUploadBusy(false);
    return;
  }
  try {
    const outgoing = deck.animate([
      { transform: 'perspective(800px) rotateY(0deg) scale(1)' },
      { transform: 'perspective(800px) rotateY(90deg) scale(.93)' }
    ], { duration: 275, easing: 'ease-in', fill: 'forwards' });
    await outgoing.finished;
    if (generation !== flipGeneration) return;
    showSide(side);
    deck.style.transform = 'perspective(800px) rotateY(-90deg) scale(.93)';
    outgoing.cancel();
    const incoming = deck.animate([
      { transform: 'perspective(800px) rotateY(-90deg) scale(.93)' },
      { transform: 'perspective(800px) rotateY(0deg) scale(1)' }
    ], { duration: 275, easing: 'ease-out' });
    await incoming.finished;
    if (generation === flipGeneration) {
      deck.style.transform = '';
      showSide(side);
      setUploadBusy(false);
    }
  } catch {
    // A newer flip owns the display after cancelling this animation.
  }
}

const transport = createTransport(({ side, position, duration, tracks, status, rewinding }) => {
  tapeTracks = tracks;
  if (!requestedSide) showSide(side);
  else if (requestedSide !== side) turnCassette(side);
  else if (!deck.getAnimations().length) showSide(side);
  requestedSide = side;
  playbackStatus = status;
  playPause.textContent = ['Starting', 'Playing'].includes(status) ? 'Pause' : 'Play';
  elapsed.textContent = `${formatTime(position)} / ${formatTime(duration)}`;
  if (statusLabel.textContent !== (rewinding ? 'Rewinding' : status)) statusLabel.textContent = rewinding ? 'Rewinding' : status;
  deck.classList.toggle('playing', status === 'Playing');
  deck.classList.toggle('rewinding', rewinding);
});

for (const button of document.querySelectorAll('.controls button, .reel')) {
  const action = button.dataset.action ?? button.textContent.toLowerCase();
  button.addEventListener('click', () => {
    if (action !== 'flip') {
      flipGeneration++;
      deck.getAnimations().forEach(animation => animation.cancel());
      deck.style.transform = '';
      setUploadBusy(false);
      showSide(requestedSide);
    }
    if (action === 'toggle') {
      if (['Starting', 'Playing'].includes(playbackStatus)) transport.pause();
      else transport.play();
    } else {
      transport[action]();
    }
  });
}

// Interactive children retain their own actions, including label-generated input clicks.
deck.addEventListener('click', event => {
  if (event.target.closest('button, input, label, a, select, textarea')) return;
  transport.flip();
});

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '--:--';
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// Only File/Blob objects reach the tag reader; no remote URL or upload is used.
const ownedUrls = { A: null, B: null };
const importMessage = document.querySelector('#import-status');
const cleanTag = value => typeof value === 'string' ? value.replaceAll('\0', '').trim().slice(0, 300) : '';
for (const input of document.querySelectorAll('input[type=file]')) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    const side = input.dataset.side;
    if (!file.size || (!file.type.startsWith('audio/') && !/\.(mp3|m4a|mp4|aac|wav|ogg|opus|flac|aiff?)$/i.test(file.name))) {
      importMessage.textContent = 'Choose a nonempty audio file. Your tape has not changed.';
      return;
    }
    const url = URL.createObjectURL(file);
    const oldUrl = ownedUrls[side];
    ownedUrls[side] = url;
    const fallbackTitle = file.name.replace(/\.[^.]+$/, '') || file.name;
    transport.setTrack(side, { url, title: fallbackTitle, artist: 'Unknown artist' });
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    importMessage.textContent = `Loaded Side ${side}. Press Play on that side to listen. Files stay on your device.`;
    try {
      new window.jsmediatags.Reader(file).setTagsToRead(['title', 'artist']).read({
        onSuccess({ tags }) {
          if (ownedUrls[side] !== url) return;
          transport.setMetadata(side, url, {
            title: cleanTag(tags.title) || fallbackTitle,
            artist: cleanTag(tags.artist) || 'Unknown artist'
          });
        },
        onError() { /* A playable file need not have readable tags. */ }
      });
    } catch { /* Metadata is optional; preserve filename fallback. */ }
  });
}
document.querySelector('#demo-tape').addEventListener('click', () => {
  flipGeneration++;
  deck.getAnimations().forEach(animation => animation.cancel());
  deck.style.transform = '';
  setUploadBusy(false);
  showSide(requestedSide);
  transport.resetTape();
  for (const side of ['A', 'B']) {
    if (ownedUrls[side]) URL.revokeObjectURL(ownedUrls[side]);
    ownedUrls[side] = null;
  }
  importMessage.textContent = 'Demo tape restored. Side A is paused at the start.';
});
