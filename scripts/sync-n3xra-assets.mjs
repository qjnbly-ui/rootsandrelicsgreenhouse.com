import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(projectRoot, 'assets', 'image-urls.json');
const usagePath = path.join(projectRoot, 'public', '.well-known', 'n3xra-asset-usage.json');
const websiteSlug = process.env.N3XRA_WEBSITE_SLUG || 'roots-and-relics-be7315';
const manifestEndpoint = process.env.N3XRA_ASSET_MANIFEST_URL
  || `https://n3xra.com/api/website-asset-manifest?slug=${encodeURIComponent(websiteSlug)}`;

function validImage(image) {
  if (!image || !image.filename || !image.url) return false;
  try {
    const url = new URL(image.url);
    return url.protocol === 'https:' && url.pathname.includes('/storage/v1/object/public/website-assets-public/');
  } catch {
    return false;
  }
}

function normalizedRegistry(payload) {
  if (!payload || !Array.isArray(payload.images)) throw new Error('N3XRA returned an invalid asset manifest.');
  const seenFilenames = new Set();
  const images = payload.images.map((image) => {
    const normalized = {
      assetKey: String(image.assetKey || image.filename || '').replace(/\.[^.]+$/, ''),
      label: String(image.label || image.filename || ''),
      filename: String(image.filename || ''),
      localReference: image.localReference || null,
      url: String(image.url || ''),
      category: String(image.category || 'image'),
      altText: String(image.altText || ''),
      version: Number(image.version || 1),
    };
    if (!validImage(normalized)) throw new Error(`N3XRA returned an invalid published image: ${normalized.filename || 'unnamed asset'}.`);
    if (seenFilenames.has(normalized.filename)) throw new Error(`N3XRA returned the duplicate filename ${normalized.filename}.`);
    seenFilenames.add(normalized.filename);
    return normalized;
  });
  if (!images.length) throw new Error('N3XRA did not return any published website images.');
  return {
    policy: 'Generated from the N3XRA website asset library. Do not paste CDN URLs into site pages.',
    verification: 'The Roots and Relics build refreshes this published-only registry before generating the site.',
    images,
  };
}

async function cachedRegistry() {
  return normalizedRegistry(JSON.parse(await readFile(registryPath, 'utf8')));
}

async function loadRegistry() {
  if (process.env.N3XRA_ASSET_SYNC_OFFLINE === '1') return cachedRegistry();
  try {
    const response = await fetch(manifestEndpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `N3XRA returned ${response.status}.`);
    const registry = normalizedRegistry(payload);
    await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    return registry;
  } catch (error) {
    const required = process.env.N3XRA_ASSET_SYNC_REQUIRED === '1' || process.env.VERCEL === '1';
    if (required) throw new Error(`N3XRA asset synchronization failed: ${error.message}`);
    process.stderr.write(`N3XRA asset synchronization unavailable; using the checked-in cache. ${error.message}\n`);
    return cachedRegistry();
  }
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
  }));
  return files.flat().filter((file) => /\.(astro|ts)$/.test(file));
}

function routeForPage(file) {
  const pagesRoot = path.join(projectRoot, 'src', 'pages');
  const relative = path.relative(pagesRoot, file).replaceAll(path.sep, '/');
  if (relative.startsWith('../')) return '/*';
  if (relative === 'index.astro') return '/';
  if (relative.endsWith('/index.astro')) return `/${relative.slice(0, -'/index.astro'.length)}/`;
  return `/${relative.replace(/\.astro$/, '')}/`;
}

function occurrences(source, value) {
  if (!value) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(value, offset)) !== -1) {
    count += 1;
    offset += value.length;
  }
  return count;
}

async function buildUsageReport(registry) {
  const pages = await sourceFiles(path.join(projectRoot, 'src'));
  const sources = await Promise.all(pages.map(async (file) => ({ file, source: await readFile(file, 'utf8') })));
  const assets = registry.images.flatMap((image) => {
    const locations = sources.flatMap(({ file, source }) => {
      const count = occurrences(source, image.filename);
      return count ? [{
        route: routeForPage(file),
        sourceFile: path.relative(projectRoot, file).replaceAll(path.sep, '/'),
        occurrences: count,
      }] : [];
    });
    return locations.length ? [{ assetKey: image.assetKey, filename: image.filename, locations }] : [];
  });
  return {
    schemaVersion: 1,
    websiteSlug,
    generatedAt: new Date().toISOString(),
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
    assets,
  };
}

const registry = await loadRegistry();
const report = await buildUsageReport(registry);
await mkdir(path.dirname(usagePath), { recursive: true });
await writeFile(usagePath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`N3XRA assets: ${registry.images.length} published, ${report.assets.length} used by this build.\n`);
