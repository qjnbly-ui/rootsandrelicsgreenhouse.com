# Roots & Relics Calendar pilot

Draft only until N3XRA Calendar backend activation is approved and verified.

Organization: existing Roots & Relics (`74b2226c-6d7d-4267-9f70-5fbe106a6816`).
Calendar: `769ae412-4e58-5178-bcb5-952ba663105b`.

The calendar page and Gatherings embed use N3XRA's read-only public calendar. Organization owners and account administrators manage the same source events from https://n3xra.com/calendar/app/. Other members need an accepted calendar connection. No new users, ownership changes, notification messages, or public street-address changes.

Published feed contains seven entries across four gatherings. Fall Gathering has four timed days; remaining gatherings are all-day save-the-date ranges with unknown opening hours. Date ends are exclusive. No hours are invented. Existing event cards and downloads remain as published fallbacks; their static content is not yet synchronized with edits in Calendar.

Activation SQL and source snapshot are reviewed in the matching N3XRA pilot PR. Publish this site change only after public reads return all seven events, owner management is verified, unrelated-account writes are denied, and the embedded view is tested on desktop and phone.
