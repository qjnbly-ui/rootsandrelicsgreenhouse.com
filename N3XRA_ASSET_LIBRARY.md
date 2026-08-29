# N3XRA Asset Library

N3XRA is the source of truth for published Roots and Relics website images.

## Build flow

1. `npm run dev` and `npm run build` request the published asset manifest from `https://n3xra.com/api/website-asset-manifest?slug=roots-and-relics-be7315`.
2. The build refreshes `assets/image-urls.json`. Site pages resolve filenames through `src/lib/image-assets.ts`; pages must not contain pasted CDN URLs.
3. The build scans the site source and publishes `/.well-known/n3xra-asset-usage.json` with the finished website.
4. N3XRA Internal Files reads that live report and labels current assets as **In use** or **Available**. Newly uploaded private assets are labeled **New** or **Ready to publish**.

Production builds fail when N3XRA cannot supply the manifest, preventing deployment with an unknowingly stale asset list. Local work can intentionally use the checked-in cache with `npm run dev:offline` or `npm run build:offline`.

Deploy n3xra.com before deploying Roots and Relics whenever the bridge contract changes.
