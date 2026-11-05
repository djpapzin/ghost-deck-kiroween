import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = (await readFile(new URL('../main.js', import.meta.url), 'utf8')).replace(/^import .*\n/, '');
function setup() {
  let render;
  const commands = { flips: 0 };
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: '', dataset: {}, style: {}, classList: { toggle() {} }, handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; } });
    return nodes.get(id);
  };
  const uploads = ['A', 'B'].map(side => {
    const input = { disabled: false, dataset: { side }, addEventListener() {} };
    return { dataset: { uploadSide: side }, hidden: side === 'B', querySelector: () => input };
  });
  const animations = [];
  const deck = node('.cassette');
  deck.getAnimations = () => animations.filter(a => a.active);
  deck.animate = () => {
    let resolve, reject;
    const a = { active: true, finished: new Promise((ok, fail) => { resolve = ok; reject = fail; }), finish() { this.active = false; resolve(); }, cancel() { this.active = false; reject(new Error('cancelled')); } };
    animations.push(a); return a;
  };
  const state = { side: 'A', position: 0, duration: 60, status: 'Paused', rewinding: false, tracks: { A: { title: 'A file', artist: 'Unknown artist' }, B: { title: 'B file', artist: 'Unknown artist' } } };
  vm.runInNewContext(source, {
    document: { querySelector: node, querySelectorAll: selector => selector === '[data-upload-side]' ? uploads : selector === 'input[type=file]' ? uploads.map(x => x.querySelector()) : [] },
    matchMedia: () => ({ matches: false }),
    createTransport(callback) { render = callback; callback(state); return { flip() { commands.flips++; } }; }
  });
  return { state, nodes, uploads, animations, commands, render: () => render(state) };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('metadata arriving during incoming flip paints when flip completes', async () => {
  const x = setup(); x.state.side = 'B'; x.render();
  assert(x.uploads.every(l => l.querySelector().disabled));
  assert.equal(x.uploads[0].hidden, false);
  x.animations[0].finish(); await tick();
  assert.equal(x.nodes.get('#track').textContent, 'B file');
  assert.equal(x.uploads[0].hidden, true); assert.equal(x.uploads[1].hidden, false);
  x.state.tracks.B = { title: 'Tagged B', artist: 'Artist B' }; x.render();
  assert.equal(x.nodes.get('#track').textContent, 'B file');
  x.animations[1].finish(); await tick();
  assert.equal(x.nodes.get('#track').textContent, 'Tagged B');
  assert.equal(x.nodes.get('#artist').textContent, 'Artist B');
  assert(x.uploads.every(l => !l.querySelector().disabled));
});
test('superseded flip cannot repaint labels or enable upload early', async () => {
  const x = setup(); x.state.side = 'B'; x.render();
  x.state.side = 'A'; x.render();
  x.animations[0].finish(); await tick();
  assert(x.uploads.every(l => l.querySelector().disabled));
  x.animations[1].finish(); await tick(); x.animations[2].finish(); await tick();
  assert.equal(x.nodes.get('#side').textContent, 'Side A');
  assert.equal(x.uploads[0].hidden, false); assert.equal(x.uploads[1].hidden, true);
  assert(x.uploads.every(l => !l.querySelector().disabled));
});

test('cassette body flips once but interactive descendants never flip', () => {
  const x = setup();
  const click = x.nodes.get('.cassette').handlers.click;
  click({ target: { closest: () => null } });
  assert.equal(x.commands.flips, 1);
  for (const tag of ['button', 'input', 'label', 'a', 'select', 'textarea']) {
    click({ target: { closest(selector) { assert(selector.includes(tag)); return { tag }; } } });
  }
  assert.equal(x.commands.flips, 1);
});
