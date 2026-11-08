const views = {
  front: [0, 0],
  back: [0, 180],
  top: [-78, 0],
  bottom: [78, 0],
  left: [0, 78],
  right: [0, -78]
};

export function setupInspect() {
  if (!CSS.supports('(transform-style: preserve-3d) and (width: 1cqw) and (rotate: 1deg)')) return () => {};

  const toggle = document.querySelector('#inspect-toggle');
  const panel = document.querySelector('#inspect-panel');
  const stage = document.querySelector('#inspect-stage');
  const cassette = document.querySelector('.cassette');
  const model = document.querySelector('.inspect-model');
  const motion = document.querySelector('#inspect-motion');
  const labels = [...stage.querySelectorAll('[data-inspect-track]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let [pitch, yaw] = [18, -22];
  let direction = 0;
  let frame = null;
  let lastTime;
  let phase = 0;
  let drag;

  function orient() {
    model.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
  }

  function tick(time) {
    if (lastTime !== undefined) {
      phase += direction * Math.min(time - lastTime, 50);
      model.style.setProperty('--hub-angle', `${(phase * 0.18) % 360}deg`);
      model.style.setProperty('--tape-offset', `${(phase * 0.048) % 12}px`);
    }
    lastTime = time;
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (!panel.hidden && direction && !reducedMotion.matches) {
      if (frame === null) frame = requestAnimationFrame(tick);
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = undefined;
    }
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    stage.hidden = !open;
    cassette.classList.toggle('cassette-inspecting', open);
    cassette.inert = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Done inspecting' : 'Inspect cassette in 3D';
    if (open) stage.focus({ preventScroll: true });
    syncMotion();
  });

  panel.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      [pitch, yaw] = views[button.dataset.view];
      orient();
    });
  });

  stage.addEventListener('keydown', event => {
    const offsets = { ArrowUp: [-10, 0], ArrowDown: [10, 0], ArrowLeft: [0, -10], ArrowRight: [0, 10] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    pitch += offset[0];
    yaw += offset[1];
    orient();
  });

  stage.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    pitch -= (event.clientY - drag.y) * 0.65;
    yaw += (event.clientX - drag.x) * 0.65;
    drag.x = event.clientX;
    drag.y = event.clientY;
    orient();
  });
  stage.addEventListener('lostpointercapture', () => { drag = undefined; });
  reducedMotion.addEventListener('change', syncMotion);
  orient();

  return ({ side, position, duration, tracks, status, rewinding }) => {
    direction = rewinding ? -2.5 : status === 'Playing' ? 1 : 0;
    const message = `Side ${side} · ${rewinding ? 'Tape rewinding' : direction ? 'Tape playing' : 'Tape stopped'}`;
    if (motion.textContent !== message) motion.textContent = message;
    for (const label of labels) {
      const title = tracks[label.dataset.inspectTrack].title;
      if (label.textContent !== title) label.textContent = title;
    }
    const progress = Number.isFinite(duration) && duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
    const right = side === 'A' ? progress : 1 - progress;
    model.style.setProperty('--left-pack', 1 - right * 0.42);
    model.style.setProperty('--right-pack', 0.58 + right * 0.42);
    syncMotion();
  };
}
