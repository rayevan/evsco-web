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
  const allBtn = root.querySelector('[data-action="all"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;
  let startedAt = 0;
  let remaining = SLIDE_MS;
  let hovering = false;
  let keyboardFocus = false;
  let showAll = false;

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
    const running = !reduceMotion && !hovering && !keyboardFocus && !showAll && !document.hidden;
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

  allBtn.addEventListener('click', () => {
    showAll = !showAll;
    root.classList.toggle('is-carousel', !showAll);
    allBtn.setAttribute('aria-pressed', String(showAll));
    allBtn.textContent = showAll ? 'Show one at a time' : 'Show all';
    slides.forEach((s, n) => s.setAttribute('aria-hidden', String(!showAll && n !== index)));
    if (!showAll) show(index);
    sync();
  });

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
    if (showAll) return;
    if (e.key === 'ArrowLeft') { show(index - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { show(index + 1); e.preventDefault(); }
  });
  let touchX = null;
  live.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  live.addEventListener('touchend', (e) => {
    if (touchX === null || showAll) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  controls.hidden = false;
  allBtn.hidden = false;
  root.classList.add('is-carousel');
  show(0);
})();
