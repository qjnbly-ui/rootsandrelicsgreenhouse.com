interface JournalMedia { url: string; altText?: string; }
interface JournalPost { post_type: keyof typeof typeLabels; title: string; excerpt?: string; body: string; featured: boolean; published_at: string; media?: JournalMedia[]; }
interface JournalFeed { page: { kicker: string; intro: string; heroUrl?: string }; posts: JournalPost[]; error?: string; }

const apiBaseUrl = 'https://www.n3xra.com';
const websiteSlug = 'roots-and-relics-be7315';
const feedUrl = `${apiBaseUrl}/api/website-content-feed?slug=${websiteSlug}`;
const submissionUrl = `${apiBaseUrl}/api/website-story-submission`;
const typeLabels = { update: 'Greenhouse update', new_piece: 'New piece', farm_story: 'Farm story', customer_story: 'Found a home', event: 'Gathering' };
const grid = document.querySelector<HTMLElement>('#journal-grid')!;
const journalStatus = document.querySelector<HTMLElement>('#journal-status')!;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function renderPost(post: JournalPost, index: number) {
  const article = document.createElement('article');
  article.className = `greenhouse-journal-card${post.featured || index === 0 ? ' is-featured' : ''}`;
  const image = post.media?.[0];
  if (image?.url) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.altText || post.title;
    img.loading = index < 2 ? 'eager' : 'lazy';
    img.decoding = 'async';
    figure.append(img);
    article.append(figure);
  }
  const copy = document.createElement('div');
  copy.className = 'greenhouse-journal-card-copy';
  const meta = document.createElement('p');
  meta.className = 'kicker';
  meta.textContent = `${typeLabels[post.post_type] || 'Greenhouse note'} · ${formatDate(post.published_at)}`;
  const title = document.createElement('h3');
  title.textContent = post.title;
  const body = document.createElement('p');
  body.textContent = post.excerpt || post.body;
  copy.append(meta, title, body);
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
      journalStatus.textContent = 'The first greenhouse story is being gathered now. Please check back soon.';
      return;
    }
    grid.replaceChildren(...data.posts.map(renderPost));
    grid.hidden = false;
    journalStatus.hidden = true;
  })
  .catch(() => {
    journalStatus.textContent = 'The latest notes are resting for a moment. Please visit again shortly.';
  });

const shareForm = document.querySelector<HTMLFormElement>('#share-find-form')!;
const shareStatus = document.querySelector<HTMLElement>('#share-find-status')!;
shareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = shareForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const values = new FormData(shareForm);
  const photo = values.get('photo');
  if (!(photo instanceof File) || !photo.size) return;
  submit.disabled = true;
  shareStatus.textContent = 'Preparing your private photo upload…';
  try {
    const preparedResponse = await fetch(submissionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: websiteSlug, name: values.get('name'), email: values.get('email'), title: values.get('title'), story: values.get('story'), filename: photo.name, mimeType: photo.type, sizeBytes: photo.size, permissionToPublish: values.get('permission') === 'on', displayNamePreference: 'first_name', company: values.get('company') }) });
    const prepared = await preparedResponse.json();
    if (!preparedResponse.ok) throw new Error(prepared.error || 'Your story could not be prepared.');
    shareStatus.textContent = 'Uploading your photograph privately…';
    const uploadResponse = await fetch(prepared.uploadUrl, { method: 'PUT', headers: { 'Content-Type': photo.type, 'Cache-Control': 'max-age=3600', 'x-upsert': 'false' }, body: photo });
    if (!uploadResponse.ok) throw new Error('The photograph could not be uploaded.');
    const finalResponse = await fetch(submissionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'finalize', submissionId: prepared.submissionId, uploadSecret: prepared.uploadSecret }) });
    const final = await finalResponse.json();
    if (!finalResponse.ok) throw new Error(final.error || 'Your story could not be completed.');
    shareForm.reset();
    shareStatus.textContent = 'Thank you—your story and photo are safely with Jennifer and Pat for review.';
  } catch (error) {
    shareStatus.textContent = error instanceof Error ? error.message : 'Your story could not be sent. Please try again.';
  } finally {
    submit.disabled = false;
  }
});
