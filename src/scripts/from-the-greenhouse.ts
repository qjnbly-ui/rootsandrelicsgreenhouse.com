interface JournalMedia { url: string; altText?: string; caption?: string; }
interface JournalPost { id: string; post_type: keyof typeof typeLabels; title: string; excerpt?: string; body: string; featured: boolean; published_at: string; media?: JournalMedia[]; }
interface JournalFeed { page: { kicker: string; intro: string; heroUrl?: string }; posts: JournalPost[]; error?: string; }

const apiBaseUrl = 'https://www.n3xra.com';
const websiteSlug = 'roots-and-relics-be7315';
const requestedPost = new URLSearchParams(window.location.search).get("post");
const feedUrl = `${apiBaseUrl}/api/website-content-feed?slug=${websiteSlug}${requestedPost ? `&post=${encodeURIComponent(requestedPost)}` : ""}`;
const submissionUrl = `${apiBaseUrl}/api/website-story-submission`;
const typeLabels = { update: 'Greenhouse update', new_piece: 'New piece', farm_story: 'Farm story', customer_story: 'Customer story', event: 'Gathering' };
const grid = document.querySelector<HTMLElement>('#journal-grid')!;
const journalStatus = document.querySelector<HTMLElement>('#journal-status')!;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function renderPost(post: JournalPost, index: number) {
  const article = document.createElement('article');
  article.id = `post-${post.id}`;
  article.style.scrollMarginTop = '120px';
  article.className = `greenhouse-journal-card${post.post_type === 'customer_story' ? ' is-customer-story' : ''}${!post.media?.length ? ' is-text-only' : ''}`;
  article.dataset.postType = post.post_type;
  if (!requestedPost) article.classList.add(['layout-intro', 'layout-reverse', 'layout-wide', 'layout-community'][index % 4]!);
  const images = (post.media || []).filter((image) => image.url);
  if (images.length) {
    const gallery = document.createElement('div');
    gallery.className = 'greenhouse-journal-gallery';
    const track = document.createElement('div');
    track.className = 'greenhouse-journal-photo-track';
    track.setAttribute('aria-label', `Photos for ${post.title}`);
    track.tabIndex = 0;
    for (const image of images) {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.altText || post.title;
      img.loading = index < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';
      figure.append(img);
      if (image.caption) {
        const caption = document.createElement('figcaption');
        caption.textContent = image.caption;
        figure.append(caption);
      }
      track.append(figure);
    }
    gallery.append(track);
    if (images.length > 1) {
      const controls = document.createElement('div');
      controls.className = 'greenhouse-journal-photo-controls';
      const previous = document.createElement('button');
      previous.type = 'button'; previous.textContent = '← Previous photo';
      const next = document.createElement('button');
      next.type = 'button'; next.textContent = 'Next photo →';
      previous.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
      next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
      const update = () => { previous.disabled = track.scrollLeft < 2; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; };
      track.addEventListener('scroll', update, { passive: true });
      new ResizeObserver(update).observe(track);
      previous.disabled = true;
      controls.append(previous, next);
      gallery.append(controls);
    }
    article.append(gallery);
  }
  const copy = document.createElement('div');
  copy.className = 'greenhouse-journal-card-copy';
  const meta = document.createElement('p');
  meta.className = 'kicker';
  meta.textContent = `${typeLabels[post.post_type] || 'Greenhouse note'} · ${formatDate(post.published_at)}`;
  const title = document.createElement('h3');
  title.textContent = post.title;
  const body = document.createElement('p');
  body.textContent = requestedPost === post.id ? post.body : post.excerpt || post.body;
  body.style.whiteSpace = 'pre-line';
  copy.append(meta, title, body);
  if (post.post_type === 'customer_story') {
    const attribution = document.createElement('p');
    attribution.className = 'greenhouse-journal-customer-note';
    attribution.textContent = 'Shared by a Roots & Relics customer';
    copy.insertBefore(attribution, body);
  }
  if (!requestedPost && post.post_type !== 'event') {
    const storyLink = document.createElement('a');
    storyLink.className = 'greenhouse-journal-card-link';
    storyLink.href = `/from-the-greenhouse/?post=${encodeURIComponent(post.id)}`;
    storyLink.textContent = 'Read the story →';
    storyLink.setAttribute('aria-label', `Read ${post.title}`);
    copy.append(storyLink);
  }
  if (post.post_type === 'event') {
    const details = document.createElement('a');
    details.className = 'greenhouse-journal-card-link';
    details.href = '/greenhouse-gatherings/';
    details.innerHTML = 'View gathering details <span aria-hidden="true">→</span>';
    copy.append(details);
  }
  article.append(copy);
  return article;
}

fetch(feedUrl, { headers: { Accept: 'application/json' } })
  .then(async (response) => {
    const data = await response.json() as JournalFeed;
    if (!response.ok) throw new Error(data.error || 'The journal could not be loaded.');
    document.querySelector<HTMLElement>('#journal-kicker')!.textContent = data.page.kicker;
    document.querySelector<HTMLElement>('#journal-intro')!.textContent = data.page.intro;
    if (data.page.heroUrl) document.querySelector<HTMLImageElement>('#journal-hero-image')!.src = data.page.heroUrl;
    if (!data.posts.length) {
      journalStatus.textContent = requestedPost ? 'This post is no longer available. Visit From the Greenhouse for the latest stories.' : 'The first greenhouse story is being gathered now. Please check back soon.';
      if (requestedPost) { const link = document.createElement('a'); link.href = '/from-the-greenhouse/'; link.textContent = ' Browse all stories'; journalStatus.append(link); }
      return;
    }
    grid.replaceChildren(...data.posts.map(renderPost));
    grid.hidden = false;
    journalStatus.hidden = true;
    const filters = document.querySelector<HTMLElement>('#journal-filters')!;
    const filterStatus = document.querySelector<HTMLElement>('#journal-filter-status')!;
    if (!requestedPost) {
      const availableCategories = new Set(data.posts.map((post) => post.post_type));
      filters.querySelectorAll<HTMLButtonElement>('[data-journal-filter]').forEach((button) => {
        button.hidden = button.dataset.journalFilter !== 'all' && !availableCategories.has(button.dataset.journalFilter as JournalPost['post_type']);
      });
      filters.hidden = false;
      filters.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-journal-filter]');
        if (!button) return;
        const filter = button.dataset.journalFilter!;
        filters.querySelectorAll<HTMLButtonElement>('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        let visible = 0;
        grid.querySelectorAll<HTMLElement>('article').forEach((article) => {
          article.hidden = filter !== 'all' && article.dataset.postType !== filter;
          if (!article.hidden) visible++;
        });
        filterStatus.hidden = false;
        filterStatus.textContent = visible ? `${visible} ${visible === 1 ? 'story' : 'stories'} · ${button.textContent}` : `No ${button.textContent?.toLowerCase()} yet. More stories are on their way.`;
      });
    } else {
      const back = document.createElement('a');
      back.className = 'greenhouse-journal-card-link';
      back.href = '/from-the-greenhouse/';
      back.textContent = '← All journal stories';
      document.querySelector('.greenhouse-journal-heading')!.append(back);
    }
    if (requestedPost) {
      const selected = document.getElementById(`post-${requestedPost}`);
      if (selected) selected.scrollIntoView({ block: "start" });
      else { journalStatus.hidden = false; journalStatus.textContent = "This post is no longer available. Browse our latest stories below."; }
    }
  })
  .catch(() => {
    journalStatus.textContent = 'The latest notes are resting for a moment. Please visit again shortly.';
  });

const shareForm = document.querySelector<HTMLFormElement>('#share-find-form')!;
const shareStatus = document.querySelector<HTMLElement>('#share-find-status')!;
const photoInput = shareForm.querySelector<HTMLInputElement>('input[name="photo"]')!;
const MAX_SOURCE_BYTES = 60 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 2.5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2400;
let preparedPhoto: { source: File; promise: Promise<File> } | null = null;

function fileSize(bytes: number) {
  return `${Math.max(bytes / (1024 * 1024), 0.1).toFixed(1)} MB`;
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('This photograph could not be resized.')), type, quality));
}

async function resizePhoto(source: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(source.type)) throw new Error('Choose a JPG, PNG, WebP, or GIF photograph.');
  if (source.size > MAX_SOURCE_BYTES) throw new Error('That photograph is unusually large. Please choose one smaller than 60 MB.');
  if (source.type === 'image/gif') {
    if (source.size > 10 * 1024 * 1024) throw new Error('Animated GIFs must be smaller than 10 MB.');
    return source;
  }
  if (source.size <= TARGET_UPLOAD_BYTES) return source;

  const image = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d', { alpha: source.type === 'image/png' });
    if (!context) throw new Error('This photograph could not be resized.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const outputType = source.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    let blob = await canvasBlob(canvas, outputType, 0.88);
    for (const quality of [0.82, 0.76, 0.7]) {
      if (blob.size <= TARGET_UPLOAD_BYTES) break;
      blob = await canvasBlob(canvas, outputType, quality);
    }
    if (blob.size >= source.size) return source;
    const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
    const name = `${source.name.replace(/\.[^.]+$/, '') || 'photograph'}.${extension}`;
    return new File([blob], name, { type: outputType, lastModified: source.lastModified });
  } finally {
    image.close();
  }
}

function beginPhotoPreparation(source: File) {
  shareStatus.textContent = source.size > TARGET_UPLOAD_BYTES ? `Reducing your ${fileSize(source.size)} photograph…` : `Photograph ready (${fileSize(source.size)}).`;
  const promise = resizePhoto(source).then((photo) => {
    if (photoInput.files?.[0] === source) {
      shareStatus.textContent = photo.size < source.size
        ? `Photograph ready—reduced from ${fileSize(source.size)} to ${fileSize(photo.size)}.`
        : `Photograph ready (${fileSize(photo.size)}).`;
    }
    return photo;
  }).catch((error: unknown) => {
    if (photoInput.files?.[0] === source) shareStatus.textContent = error instanceof Error ? error.message : 'This photograph could not be prepared.';
    throw error;
  });
  preparedPhoto = { source, promise };
  return promise;
}

function uploadPhoto(uploadUrl: string, photo: File) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', photo.type);
    request.setRequestHeader('Cache-Control', 'max-age=3600');
    request.setRequestHeader('x-upsert', 'false');
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      shareStatus.textContent = `Uploading photograph—${Math.round((event.loaded / event.total) * 100)}%. Keep this page open.`;
    });
    request.addEventListener('load', () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error('The photograph could not be uploaded.')));
    request.addEventListener('error', () => reject(new Error('The photograph could not be uploaded. Check your connection and try again.')));
    request.addEventListener('abort', () => reject(new Error('The photograph upload was canceled.')));
    request.send(photo);
  });
}

photoInput.addEventListener('change', () => {
  const source = photoInput.files?.[0];
  preparedPhoto = null;
  if (source) void beginPhotoPreparation(source).catch(() => undefined);
});

shareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = shareForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const values = new FormData(shareForm);
  const sourcePhoto = photoInput.files?.[0];
  if (!sourcePhoto?.size) return;
  submit.disabled = true;
  try {
    const photo = preparedPhoto?.source === sourcePhoto ? await preparedPhoto.promise : await beginPhotoPreparation(sourcePhoto);
    shareStatus.textContent = `Starting the ${fileSize(photo.size)} upload… Keep this page open.`;
    const preparedResponse = await fetch(submissionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: websiteSlug, name: values.get('name'), email: values.get('email'), title: values.get('title'), story: values.get('story'), filename: photo.name, mimeType: photo.type, sizeBytes: photo.size, permissionToPublish: values.get('permission') === 'on', displayNamePreference: 'first_name', company: values.get('company') }) });
    const prepared = await preparedResponse.json();
    if (!preparedResponse.ok) throw new Error(prepared.error || 'Your story could not be prepared.');
    await uploadPhoto(prepared.uploadUrl, photo);
    shareStatus.textContent = 'Finishing your story…';
    const finalResponse = await fetch(submissionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'finalize', submissionId: prepared.submissionId, uploadSecret: prepared.uploadSecret }) });
    const final = await finalResponse.json();
    if (!finalResponse.ok) throw new Error(final.error || 'Your story could not be completed.');
    shareForm.reset();
    preparedPhoto = null;
    shareStatus.textContent = 'Thank you—your story and photo are safely with Jennifer and Pat for review.';
  } catch (error) {
    shareStatus.textContent = error instanceof Error ? error.message : 'Your story could not be sent. Please try again.';
  } finally {
    submit.disabled = false;
  }
});
