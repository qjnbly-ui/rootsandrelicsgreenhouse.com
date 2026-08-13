const demoGate = document.querySelector<HTMLElement>('[data-demo-gate]');
const demoEnter = document.querySelector<HTMLButtonElement>('[data-demo-enter]');
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
  const pageSurfaces = [...document.body.children].filter((element) => element !== demoGate) as HTMLElement[];
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

const menuButton = document.querySelector<HTMLButtonElement>('[data-menu]');
const nav = document.querySelector<HTMLElement>('#site-nav');

const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  const label = menuButton?.querySelector('span');
  if (label) label.textContent = 'Menu';
  nav?.classList.remove('is-open');
  document.body.style.overflow = '';
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  if (open) {
    closeMenu();
    return;
  }
  menuButton.setAttribute('aria-expanded', 'true');
  const label = menuButton.querySelector('span');
  if (label) label.textContent = 'Close';
  nav?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

const galleryLightbox = document.querySelector<HTMLElement>('[data-gallery-lightbox]');
const galleryExpandedImage = galleryLightbox?.querySelector<HTMLImageElement>('[data-gallery-expanded]');
const galleryItems = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]')];
const galleryCloseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-close]')];
const galleryPrevious = document.querySelector<HTMLButtonElement>('[data-gallery-previous]');
const galleryNext = document.querySelector<HTMLButtonElement>('[data-gallery-next]');
let galleryIndex = -1;

const showGalleryImage = (index: number) => {
  if (!galleryExpandedImage || !galleryItems.length) return;
  galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const source = galleryItems[galleryIndex]?.querySelector<HTMLImageElement>('img');
  if (!source) return;
  galleryExpandedImage.src = source.currentSrc || source.src;
  galleryExpandedImage.alt = source.alt;
};

const openGalleryLightbox = (index: number) => {
  if (!galleryLightbox) return;
  showGalleryImage(index);
  galleryLightbox.hidden = false;
  document.body.classList.add('gallery-lightbox-open');
  requestAnimationFrame(() => galleryLightbox.querySelector<HTMLButtonElement>('.gallery-lightbox-close')?.focus({ preventScroll: true }));
};

const closeGalleryLightbox = () => {
  if (!galleryLightbox || galleryLightbox.hidden) return;
  galleryLightbox.hidden = true;
  document.body.classList.remove('gallery-lightbox-open');
  galleryItems[galleryIndex]?.focus({ preventScroll: true });
};

galleryItems.forEach((item, index) => item.addEventListener('click', () => openGalleryLightbox(index)));
galleryCloseButtons.forEach((button) => button.addEventListener('click', closeGalleryLightbox));
galleryPrevious?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
galleryNext?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

document.addEventListener('keydown', (event) => {
  if (galleryLightbox && !galleryLightbox.hidden) {
    if (event.key === 'Escape') {
      closeGalleryLightbox();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showGalleryImage(galleryIndex - 1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showGalleryImage(galleryIndex + 1);
      return;
    }
  }
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      (entry.target as HTMLElement).classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll<HTMLElement>('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const parallaxImages = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];

if (!reduceMotion && parallaxImages.length) {
  let ticking = false;
  const updateParallax = () => {
    parallaxImages.forEach((image) => {
      const box = image.parentElement?.getBoundingClientRect();
      if (box && box.bottom > 0 && box.top < window.innerHeight) {
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
