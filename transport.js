export function createTransport(render, makeAudio = url => new Audio(url)) {
  const positions = { A: 0, B: 0 };
  const completed = { A: false, B: false };
  const demoTracks = () => ({
    A: { url: 'audio/side-a.wav?v=music-only-1', title: 'After Hours', artist: 'Ghost Deck' },
    B: { url: 'audio/side-b.wav', title: 'First Light', artist: 'Ghost Deck' }
  });
  let tracks = demoTracks();
  const durations = { A: null, B: null };
  const click = makeAudio('audio/click.wav');
  const flipSound = makeAudio('audio/flip.wav');
  const rewindSound = makeAudio('audio/rewind-trimmed.wav?v=trimmed-2');
  let side = 'A';
  let media;
  let generation = 0;
  let status = 'Paused';
  let positioned = false;
  let rewinding = false;

  function update() {
    render({ side, position: positions[side], duration: durations[side], tracks, status, rewinding });
  }

  function stopEffects() {
    rewinding = false;
    for (const effect of [click, rewindSound, flipSound]) {
      effect.pause();
      if (effect.readyState) effect.currentTime = 0;
    }
  }

  function loadSide() {
    media?.pause();
    const track = makeAudio(tracks[side].url);
    track.preload = 'metadata';
    media = track;
    positioned = false;
    track.addEventListener('loadedmetadata', () => {
      if (media !== track) return;
      durations[side] = Number.isFinite(track.duration) ? track.duration : null;
      if (!positioned) seek(track);
      update();
    });
    track.addEventListener('durationchange', () => {
      if (media !== track) return;
      durations[side] = Number.isFinite(track.duration) ? track.duration : null;
      update();
    });
    track.addEventListener('timeupdate', () => {
      if (media !== track || !positioned || status !== 'Playing') return;
      positions[side] = track.currentTime;
      update();
    });
    track.addEventListener('error', () => {
      if (media !== track || !track.error) return;
      generation++;
      track.pause();
      if (positioned) positions[side] = track.currentTime;
      stopEffects();
      status = 'Could not play';
      update();
    });
    track.addEventListener('ended', () => {
      if (media !== track || !track.ended || !['Starting', 'Playing'].includes(status)) return;
      generation++;
      completed[side] = true;
      positions[side] = track.currentTime;
      status = 'Ended';
      stopEffects();
      click.play().catch(() => {});
      update();
    });
    if (track.readyState) seek(track);
  }

  function seek(track) {
    // A pending seek can be set before metadata. Preserve the requested position until loaded.
    track.currentTime = Number.isFinite(track.duration)
      ? Math.min(positions[side], track.duration)
      : positions[side];
    positioned = track.readyState > 0;
    if (positioned) positions[side] = track.currentTime;
  }

  function pause() {
    generation++;
    media.pause();
    stopEffects();
    if (positioned) positions[side] = media.currentTime;
    status = 'Paused';
  }

  async function play() {
    if (status === 'Starting' || status === 'Playing') return;
    stopEffects();
    if (status === 'Could not play' || media.error) loadSide();
    if (completed[side]) {
      completed[side] = false;
      positions[side] = 0;
    }
    const track = media;
    const attempt = ++generation;
    seek(track);
    status = 'Starting';
    update();
    try {
      await track.play();
      if (attempt !== generation || media !== track) return;
      status = 'Playing';
    } catch {
      if (attempt !== generation || media !== track) return;
      track.pause();
      status = 'Could not play';
    }
    update();
  }

  rewindSound.addEventListener('error', () => {
    if (!rewindSound.error) return;
    rewindSound.pause();
    rewinding = false;
    update();
  });

  rewindSound.addEventListener('ended', () => {
    if (!rewindSound.ended) return;
    rewinding = false;
    update();
  });

  loadSide();
  update();
  return {
    play,
    setTrack(targetSide, track) {
      if (!['A', 'B'].includes(targetSide)) throw new Error('Invalid tape side');
      pause();
      tracks[targetSide] = { ...track };
      positions[targetSide] = 0;
      completed[targetSide] = false;
      durations[targetSide] = null;
      if (targetSide === side) loadSide();
      update();
    },
    setMetadata(targetSide, url, metadata) {
      if (tracks[targetSide]?.url !== url) return;
      tracks[targetSide] = { ...tracks[targetSide], ...metadata };
      update();
    },
    resetTape() {
      pause();
      tracks = demoTracks();
      for (const target of ['A', 'B']) {
        positions[target] = 0;
        durations[target] = null;
        completed[target] = false;
      }
      side = 'A';
      loadSide();
      update();
    },
    pause() { pause(); update(); },
    rewind() {
      pause();
      positions[side] = 0;
      completed[side] = false;
      seek(media);
      const attempt = generation;
      rewinding = true;
      if (rewindSound.error) rewindSound.load();
      rewindSound.play().catch(() => {
        if (attempt !== generation) return;
        rewinding = false;
        update();
      });
      update();
    },
    flip() {
      pause();
      flipSound.play().catch(() => {});
      side = side === 'A' ? 'B' : 'A';
      loadSide();
      update();
    }
  };
}
