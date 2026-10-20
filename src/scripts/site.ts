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
if (!document.querySelector('main[data-gallery-album]')) shuffleGallery();
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
  const download = galleryLightbox?.querySelector<HTMLAnchorElement>('[data-gallery-expanded-download]');
  if (download) {
    const url = new URL(galleryExpandedImage.src);
    url.searchParams.set('download', decodeURIComponent(url.pathname.split('/').pop() || 'photo.jpg'));
    download.href = url.href;
  }
  document.dispatchEvent(new CustomEvent('gallery:selected', {detail: {asset: galleryItems[galleryIndex]?.closest<HTMLElement>('[data-asset]')?.dataset.asset}}));
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

const boundGalleryItems = new WeakSet<HTMLButtonElement>();
const bindGalleryItems = () => {
  const selected = galleryItems[galleryIndex];
  const removed = selected && !selected.isConnected && galleryLightbox && !galleryLightbox.hidden;
  if (removed) closeGalleryLightbox();
  galleryItems = [...document.querySelectorAll<HTMLButtonElement>('[data-gallery-item]')];
  if (removed) galleryItems[Math.min(galleryIndex,galleryItems.length-1)]?.focus({preventScroll:true});
  if (selected?.isConnected) {
    galleryIndex = galleryItems.indexOf(selected);
    if (galleryLightbox && !galleryLightbox.hidden) showGalleryImage(galleryIndex);
  }
  galleryItems.forEach((item) => {
    if (boundGalleryItems.has(item)) return;
    boundGalleryItems.add(item);
    item.addEventListener('click', () => openGalleryLightbox(galleryItems.indexOf(item)));
  });
};
bindGalleryItems();
document.addEventListener('gallery:updated', bindGalleryItems);
galleryCloseButtons.forEach((button) => button.addEventListener('click', closeGalleryLightbox));
galleryPrevious?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
galleryNext?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

document.addEventListener('keydown', (event) => {
  if (galleryLightbox && !galleryLightbox.hidden && !document.querySelector('dialog[open]')) {
    if ((event.target as HTMLElement).closest('textarea,input,select')) return;
    if(event.key==='Tab'){
      const controls=[...galleryLightbox.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')].filter(item=>item.offsetParent!==null);
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
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

// Keep swipe navigation on the photo itself; menu controls retain ordinary touch behavior.
let galleryTouch: {x:number;y:number}|null=null;
galleryExpandedImage?.addEventListener('touchstart',event=>{
  galleryTouch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
},{passive:true});
galleryExpandedImage?.addEventListener('touchend',event=>{
  if(!galleryTouch||!event.changedTouches.length)return;
  const dx=event.changedTouches[0].clientX-galleryTouch.x,dy=event.changedTouches[0].clientY-galleryTouch.y;
  galleryTouch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)showGalleryImage(galleryIndex+(dx<0?1:-1));
},{passive:true});
galleryExpandedImage?.addEventListener('touchcancel',()=>{galleryTouch=null;},{passive:true});
