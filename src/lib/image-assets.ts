import imageRegistry from '../../assets/image-urls.json';

const imageByFilename = new Map(
  imageRegistry.images.map(({ filename, url }) => [filename, url]),
);

export function imageUrl(filename: string): string {
  const url = imageByFilename.get(filename);
  if (!url) throw new Error(`Missing N3XRA website image for ${filename}`);
  return url;
}

export function hasImage(filename: string): boolean {
  return imageByFilename.has(filename);
}

export function imagePreviewUrl(
  filename: string,
  { width = 960, height = 720, quality = 72 } = {},
): string {
  const source = imageUrl(filename);
  const url = new URL(source);
  url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  url.searchParams.set('width', String(width));
  url.searchParams.set('height', String(height));
  url.searchParams.set('resize', 'contain');
  url.searchParams.set('quality', String(quality));
  return url.toString();
}
