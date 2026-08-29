import imageRegistry from '../../assets/image-urls.json';

const imageByFilename = new Map(
  imageRegistry.images.map(({ filename, url }) => [filename, url]),
);

export function imageUrl(filename: string): string {
  const url = imageByFilename.get(filename);
  if (!url) throw new Error(`Missing N3XRA website image for ${filename}`);
  return url;
}
