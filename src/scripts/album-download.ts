export {};

const button = document.querySelector<HTMLButtonElement>('[data-download-all]');
const status = document.querySelector<HTMLElement>('[data-download-status]');
const grid = document.querySelector<HTMLElement>('[data-gallery-grid]');

if (button && status && grid) {
  let downloading = false;
  const updateButton = () => {
    button.disabled = downloading || !grid.querySelector('[data-full-src]');
  };
  document.addEventListener('gallery:updated', updateButton);

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    downloading = true;
    updateButton();
    const photos = Array.from(grid.querySelectorAll<HTMLImageElement>('img[data-full-src]'));
    try {
      const { Zip, ZipPassThrough } = await import('fflate');
      const chunks: Blob[] = [];
      const zip = new Zip((error, chunk) => {
        if (error) throw error;
        chunks.push(new Blob([new Uint8Array(chunk)]));
      });
      for (const [index, photo] of photos.entries()) {
        status.textContent = `Preparing photo ${index + 1} of ${photos.length}…`;
        const response = await fetch(photo.dataset.fullSrc!, { signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw new Error('Photo unavailable');
        const filename = photo.closest<HTMLElement>('[data-gallery-filename]')?.dataset.galleryFilename || 'photo.jpg';
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const file = new ZipPassThrough(`${String(index + 1).padStart(2, '0')}-${safeName}`);
        zip.add(file);
        file.push(new Uint8Array(await response.arrayBuffer()), true);
      }
      zip.end();
      const url = URL.createObjectURL(new Blob(chunks, { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'october-gathering-2026.zip';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = `Download started for ${photos.length} photos.`;
    } catch {
      status.textContent = 'The album download could not finish. Select Download all to try again.';
    } finally {
      downloading = false;
      updateButton();
    }
  });
}
