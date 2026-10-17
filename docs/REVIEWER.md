# Be Hanuman reviewer checks

Test URL: https://www.behanuman.com/ . Original app https://hanuman.dyut.si/ remains separate.

Use the current review branch/PR rather than assuming the default branch matches the test build. Exact final remote commit and deployment are recorded in the release handoff after publication. Do not use any maintainer key or account for local setup.

## Phone journey

1. In a fresh browser, Continue as guest should open Doha1 after an optional recitation choice, without personal setup or Google.
2. Refresh; reading should remain accessible. Set a Sankalp through the normal optional setup journey if desired.
3. Complete a real reading. The Google save prompt should remain optional. On a real test account, preserve the guest practice when choosing a merge, then compare readings/Sankalp on the second phone using the same Google account.
4. In Learn, Mark Learned changes progress; scrolling alone does not. Favourite and Revisit remain independent.
5. Enable Simple mode in Settings: only Chant appears below, Full mode at top right restores all tabs without changing the current verse.
6. Check recitation, language, theme, keyboard and browser Add to Home Screen guidance on each physical device.

## Evidence and limits

Automated tests cover account isolation, idempotent guest imports and reading events, explicit Learn actions, schema validation, source/review gates, safe provider failures and rate limits. Browser checks have passed direct guest entry/refresh, Simple/Full verse retention and an existing Google account’s callback/saved Sankalp. Independent physical iPhone/Pixel synchronisation and fresh guest-to-Google merge still require acceptance testing; do not call these passed from unit tests alone.

Analytics separates explicit login returns, unique observed accounts, saved reading completions, explicit learned verses and anonymous device entries. QA stays separate. A device is not a unique person; client-reported origin is not verified acquisition attribution. No page-view/referrer funnel or payment verification is implemented. No public analytics endpoint exposes personal data.

Claude key/provider availability was checked with a read-only model-list request. No paid generated response has been verified. Generation stays off while any required content/rights gate is unresolved. The full Ramcharitmanas archive is not sent wholesale to the model. Only eligible structured passages can enter matching/context.

The copied source dataset is retained separately under its upstream ODbL1.0 notice and pinned commit. All seven supplied kanda files are present; this does not establish critical-edition accuracy. Keep ancient original text, new paraphrase, modern reflection and any translation clearly distinct.
