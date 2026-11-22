// Rotating highlight cards.
// Without this script the cards render as a plain list.
(() => {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const SLIDE_MS = 7000;

  const slides = Array.from(root.querySelectorAll('.slide'));
  const live = root.querySelector('.slides');
  const controls = root.querySelector('.controls');
  const dotsWrap = root.querySelector('.dots');
  const count = root.querySelector('.count');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;
  let startedAt = 0;
  let remaining = SLIDE_MS;
  let hovering = false;
  let keyboardFocus = false;

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.setAttribute('aria-label', 'Show card ' + (i + 1));
    b.addEventListener('click', () => show(i));
    dotsWrap.appendChild(b);
    return b;
  });

  function restartTimer() {
    clearTimeout(timer);
    timer = null;
    remaining = SLIDE_MS;
    sync();
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const active = n === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((d, n) => d.setAttribute('aria-current', n === index ? 'true' : 'false'));
    count.textContent = index + 1 + ' / ' + slides.length;
    restartTimer();
  }

  // Starts or pauses the timer. A paused card resumes with the time it had left.
  function sync() {
    // Reduced-motion visitors only get manual controls.
    const running = !reduceMotion && !hovering && !keyboardFocus && !document.hidden;
    live.setAttribute('aria-live', running ? 'off' : 'polite');

    if (running && timer === null) {
      startedAt = performance.now();
      timer = setTimeout(() => show(index + 1), remaining);
    } else if (!running && timer !== null) {
      clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    }
  }

  document.addEventListener('visibilitychange', sync);

  root.querySelector('[data-action="prev"]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-action="next"]').addEventListener('click', () => show(index + 1));

  // Pause while the pointer is over the card or a keyboard user is inside it.
  root.addEventListener('mouseenter', () => { hovering = true; sync(); });
  root.addEventListener('mouseleave', () => { hovering = false; sync(); });
  root.addEventListener('focusin', (e) => {
    keyboardFocus = e.target.matches(':focus-visible');
    sync();
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) { keyboardFocus = false; sync(); }
  });

  // Arrow keys and swipes.
  root.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return; // leave browser shortcuts alone
    if (e.key === 'ArrowLeft') { show(index - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { show(index + 1); e.preventDefault(); }
  });
  let touchStart = null;
  live.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  live.addEventListener('touchend', (e) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    // Mostly-vertical movement is a page scroll, not a swipe.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  });

  controls.hidden = false;
  root.classList.add('is-carousel');
  show(0);
})();
