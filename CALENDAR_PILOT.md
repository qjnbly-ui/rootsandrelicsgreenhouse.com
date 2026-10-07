# Roots & Relics Calendar pilot

Pilot activated after explicit approval on October 7, 2026. N3XRA Calendar database setup and seven published event imports are complete. Rolled-back permission tests passed: public counts and private-field exclusion, owner updates, unrelated-account denial, organization connections, and public-display revocation.

Organization: existing Roots & Relics (`74b2226c-6d7d-4267-9f70-5fbe106a6816`).
Calendar: `769ae412-4e58-5178-bcb5-952ba663105b`.

The calendar page and Gatherings embed use N3XRA's read-only public calendar. Organization owners and account administrators manage the same source events from https://n3xra.com/calendar/app/. Other members need an accepted calendar connection. No new users, ownership changes, notification messages, or public street-address changes.

Published feed contains seven entries across four gatherings. Fall Gathering has four timed days; remaining gatherings are all-day save-the-date ranges with unknown opening hours. Date ends are exclusive. No hours are invented. Existing event cards and downloads remain as published fallbacks; their static content is not yet synchronized with edits in Calendar.

Activation SQL and source snapshot are reviewed in the matching N3XRA pilot PR. Public production Calendar navigation was verified for October, November and December. The site build and Astro checks pass; desktop and 390px phone layout were checked locally, including Calendar navigation. Vercel preview authentication was left intact. Existing owner privileges were verified through database operations; no owner account was impersonated in the browser.
