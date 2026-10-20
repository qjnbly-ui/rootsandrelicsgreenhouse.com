const menuButton = document.querySelector<HTMLButtonElement>('[data-menu]');
const nav = document.querySelector<HTMLElement>('#site-nav');

const annualDateBanners = [...document.querySelectorAll<HTMLElement>('[data-annual-date][data-time-zone]')];

const updateAnnualDateBanners = () => {
  annualDateBanners.forEach((banner) => {
    const annualDate = banner.dataset.annualDate;
    const timeZone = banner.dataset.timeZone;
    if (!annualDate || !timeZone) return;

    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const month = dateParts.find((part) => part.type === 'month')?.value;
    const day = dateParts.find((part) => part.type === 'day')?.value;
    banner.hidden = `${month}-${day}` !== annualDate;
  });
};

if (annualDateBanners.length) {
  updateAnnualDateBanners();
  window.setInterval(updateAnnualDateBanners, 60_000);
}

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
let galleryItems = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]')];
const shuffleGallery = () => {
  document.querySelectorAll<HTMLElement>('[data-gallery-grid]').forEach((grid) => {
    const photos = [...grid.children];
    for (let index = photos.length - 1; index > 0; index -= 1) {
      const next = Math.floor(Math.random() * (index + 1));
      [photos[index], photos[next]] = [photos[next], photos[index]];
    }
    grid.append(...photos);
  });
  galleryItems = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]')];
};
shuffleGallery();
const galleryShuffleButton = document.querySelector<HTMLButtonElement>('[data-gallery-shuffle]');
if (galleryShuffleButton) {
  galleryShuffleButton.hidden = false;
  galleryShuffleButton.addEventListener('click', shuffleGallery);
}
const galleryCloseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-close]')];
const galleryPrevious = document.querySelector<HTMLButtonElement>('[data-gallery-previous]');
const galleryNext = document.querySelector<HTMLButtonElement>('[data-gallery-next]');
let galleryIndex = -1;

const galleryFullSource = (index: number) => {
  const source = galleryItems[index]?.querySelector<HTMLImageElement>('img');
  return source?.dataset.fullSrc || source?.currentSrc || source?.src || '';
};

const preloadGalleryNeighbor = (index: number) => {
  const source = galleryFullSource((index + galleryItems.length) % galleryItems.length);
  if (source) new Image().src = source;
};

const showGalleryImage = (index: number) => {
  if (!galleryExpandedImage || !galleryItems.length) return;
  galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const source = galleryItems[galleryIndex]?.querySelector<HTMLImageElement>('img');
  if (!source) return;
  galleryExpandedImage.src = galleryFullSource(galleryIndex);
  galleryExpandedImage.alt = source.alt;
  preloadGalleryNeighbor(galleryIndex - 1);
  preloadGalleryNeighbor(galleryIndex + 1);
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

galleryItems.forEach((item) => item.addEventListener('click', () => openGalleryLightbox(galleryItems.indexOf(item))));
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

// Refresh public album membership so a removed photo disappears without a site rebuild.
if (document.querySelector('[data-gallery-grid], [data-gallery-album-prefix]')) {
  void (async () => {
    const endpoint = new URL('https://www.n3xra.com/api/website-asset-manifest');
    endpoint.searchParams.set('slug', 'roots-and-relics-be7315');
    endpoint.searchParams.set('_sync', String(Date.now()));
    const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return;
    const manifest = await response.json();
    if (!Array.isArray(manifest.images)) return;
    const images = manifest.images.filter((image: { filename?: unknown; url?: unknown }) => typeof image.filename === 'string' && typeof image.url === 'string');
    const published = new Set(images.map((image: { filename: string }) => image.filename));
    const expandedItem = galleryItems[galleryIndex];
    document.querySelectorAll<HTMLElement>('[data-gallery-filename]').forEach((photo) => {
      if (!published.has(photo.dataset.galleryFilename)) photo.remove();
    });
    if (galleryLightbox && !galleryLightbox.hidden && expandedItem && !expandedItem.isConnected) closeGalleryLightbox();
    galleryItems = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]')];
    if (expandedItem?.isConnected) galleryIndex = galleryItems.indexOf(expandedItem);
    document.querySelectorAll<HTMLElement>('[data-gallery-grid]').forEach((grid) => {
      const count = grid.querySelectorAll('[data-gallery-item]').length;
      const label = grid.parentElement?.querySelector('[data-gallery-count]');
      if (label) label.textContent = `${count} photos`;
      const empty = grid.parentElement?.querySelector<HTMLElement>('[data-gallery-empty]');
      if (empty) empty.hidden = count > 0;
      const cover = document.querySelector<HTMLImageElement>('.gallery-album-hero .gallery-hero-image img');
      const first = grid.querySelector<HTMLImageElement>('img');
      if (cover && first && !images.some((image: { url: string }) => image.url === cover.src)) cover.src = first.src;
    });
    document.querySelectorAll<HTMLAnchorElement>('[data-gallery-album-prefix]').forEach((card) => {
      const albumImages = images.filter((image: { filename: string }) => image.filename.startsWith(card.dataset.galleryAlbumPrefix || ''));
      card.hidden = albumImages.length === 0;
      const label = card.querySelector('[data-gallery-count]');
      if (label) label.textContent = `${albumImages.length} photos`;
      const cover = card.querySelector('img');
      if (cover && albumImages.length && !albumImages.some((image: { url: string }) => image.url === cover.src)) cover.src = albumImages[0].url;
    });
  })().catch(() => { /* Keep the last successfully built collection during an outage. */ });
}
