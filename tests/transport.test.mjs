import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = await readFile(new URL('../transport.js', import.meta.url), 'utf8');
const { createTransport } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function setup() {
  const audio = []; let state; let peak = 0;
  const make = url => {
    const listeners = {};
    const a = { url, paused: true, ended: false, readyState: 1, duration: 120, currentTime: 0,
      addEventListener(name, fn) { (listeners[name] ??= []).push(fn); },
      emit(name) { for (const fn of listeners[name] ?? []) fn(); },
      pause() { this.paused = true; },
      play() { this.paused = false; this.ended = false; peak = Math.max(peak, audio.filter(x => !x.paused && !x.ended).length); return Promise.resolve(); },
      load() { this.error = null; }
    }; audio.push(a); return a;
  };
  const transport = createTransport(s => { state = structuredClone(s); }, make);
  const current = () => audio.at(-1);
  return { transport, audio, current, get state() { return state; }, get peak() { return peak; } };
}
test('replacement pauses, resets only target and keeps other position', async () => {
  const x = setup(); await x.transport.play(); x.current().currentTime = 17;
  x.transport.flip(); await x.transport.play(); x.current().currentTime = 29;
  x.transport.setTrack('A', { url: 'blob:a', title: 'New A', artist: 'Artist' });
  assert.equal(x.state.side, 'B'); assert.equal(x.state.position, 29); assert.equal(x.state.status, 'Paused');
  x.transport.flip(); assert.equal(x.state.position, 0); assert.equal(x.current().url, 'blob:a');
  x.transport.flip(); assert.equal(x.state.position, 29); assert.equal(x.peak, 1);
});
test('stale metadata and retired media events cannot alter replacement', () => {
  const x = setup(); const old = x.current();
  x.transport.setTrack('A', { url: 'blob:new', title: 'New', artist: 'Unknown artist' });
  x.transport.setMetadata('A', 'blob:old', { title: 'Stale' });
  old.duration = 999; old.emit('loadedmetadata'); old.error = {}; old.emit('error');
  assert.equal(x.state.tracks.A.title, 'New'); assert.equal(x.state.status, 'Paused');
  x.current().duration = 63; x.current().emit('loadedmetadata');
  assert.equal(x.state.duration, 63);
});
test('rapid replacement, playback, flip and rewind keep one audio owner', async () => {
  const x = setup();
  for (let i = 0; i < 40; i++) {
    const pending = x.transport.play(); x.transport.rewind();
    x.transport.setTrack(i % 2 ? 'A' : 'B', { url: `blob:${i}`, title: 'Test', artist: 'Test' });
    x.transport.flip(); await x.transport.play(); x.transport.pause(); await pending;
  }
  assert.equal(x.peak, 1); assert.equal(x.state.status, 'Paused');
});
test('reset restores demo and stale local tag reads cannot change it', () => {
  const x = setup(); x.transport.setTrack('A', { url: 'blob:a', title: 'Local', artist: 'Local' });
  x.transport.flip(); x.transport.resetTape();
  x.transport.setMetadata('A', 'blob:a', { title: 'Late' });
  assert.equal(x.state.side, 'A'); assert.equal(x.state.position, 0);
  assert.equal(x.state.tracks.A.title, 'After Hours'); assert.equal(x.current().url, 'audio/side-a.wav?v=music-only-1');
});
test('audio failure clears rewind and permits replacing failed track', async () => {
  const x = setup(); x.transport.rewind(); const effect = x.audio[2];
  effect.error = {}; effect.emit('error'); assert.equal(x.state.rewinding, false);
  x.current().error = {}; x.current().emit('error'); assert.equal(x.state.status, 'Could not play');
  x.transport.setTrack('A', { url: 'blob:good', title: 'Good', artist: 'Test' });
  await x.transport.play(); assert.equal(x.state.status, 'Playing'); assert.equal(x.peak, 1);
});
