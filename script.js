const demoGate = document.querySelector('[data-demo-gate]');
const demoEnter = document.querySelector('[data-demo-enter]');
const demoSessionKey = 'rootsRelicsDemoEntered';
let demoWasEntered = false;

try {
  demoWasEntered = sessionStorage.getItem(demoSessionKey) === 'true';
} catch {
  demoWasEntered = false;
}

if (demoWasEntered) {
  demoGate?.remove();
} else if (demoGate && demoEnter) {
  const pageSurfaces = [...document.body.children].filter((element) => element !== demoGate);
  document.body.classList.add('demo-gate-open');
  pageSurfaces.forEach((element) => { element.inert = true; });
  requestAnimationFrame(() => demoEnter.focus({ preventScroll: true }));

  demoEnter.addEventListener('click', () => {
    try {
      sessionStorage.setItem(demoSessionKey, 'true');
    } catch {
      // The demo still opens when browser storage is unavailable.
    }
    demoGate.classList.add('is-leaving');
    window.setTimeout(() => {
      pageSurfaces.forEach((element) => { element.inert = false; });
      document.body.classList.remove('demo-gate-open');
      demoGate.remove();
    }, 420);
  });

  document.addEventListener('keydown', (event) => {
    if (!document.body.classList.contains('demo-gate-open')) return;
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      demoEnter.focus({ preventScroll: true });
    }
  });
}

const menuButton = document.querySelector('[data-menu]');
const nav = document.querySelector('#site-nav');

const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.querySelector('span').textContent = 'Menu';
  nav?.classList.remove('is-open');
  document.body.style.overflow = '';
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  if (open) {
    closeMenu();
    return;
  }
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.querySelector('span').textContent = 'Close';
  nav.classList.add('is-open');
  document.body.style.overflow = 'hidden';
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const parallaxImages = [...document.querySelectorAll('[data-parallax]')];

if (!reduceMotion && parallaxImages.length) {
  let ticking = false;
  const updateParallax = () => {
    parallaxImages.forEach((image) => {
      const box = image.parentElement.getBoundingClientRect();
      if (box.bottom > 0 && box.top < window.innerHeight) {
        const movement = (box.top / window.innerHeight) * -42;
        image.style.transform = `translate3d(0, ${movement}px, 0)`;
      }
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
  updateParallax();
}
