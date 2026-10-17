# Be Hanuman reviewer checks

Test URL: https://www.behanuman.com/ . Original app https://hanuman.dyut.si/ remains separate.

Current tested frontend is rd7ylcy2l / dpl_AwcAdeiTy9wtszkLc6YSQSHycsv4. Read RELEASE-2026-10-17.md; the old core commit alone does not contain this final release. Do not use any maintainer key or account for local setup.

## Phone journey

1. In a fresh browser, Continue as guest should open Doha1 after an optional recitation choice, without personal setup or Google.
2. Refresh; reading should remain accessible. Set a Sankalp through the normal optional setup journey if desired.
3. Complete a real reading. The Google save prompt should remain optional. On a real test account, preserve the guest practice when choosing a merge, then compare readings/Sankalp on the second phone using the same Google account.
4. In Learn, Mark Learned changes progress; scrolling alone does not. Favourite and per-verse Revisit remain independent. The bottom Revisit list has been removed.
5. Enable Simple mode in Settings: only Chant appears below, Full mode at top right restores all tabs without changing the current verse.
6. Check recitation, language, theme, keyboard and browser Add to Home Screen guidance on each physical device.

## Evidence and limits

Automated tests cover account isolation, idempotent guest imports and reading events, explicit Learn actions, schema validation, source/review gates, safe provider failures and rate limits. Browser checks have passed direct guest entry/refresh, Simple/Full verse retention and an existing Google account’s callback/saved Sankalp. Independent physical iPhone/Pixel synchronisation and fresh guest-to-Google merge still require acceptance testing; do not call these passed from unit tests alone.

Analytics separates explicit login returns, unique observed accounts, saved reading completions, explicit learned verses and anonymous device entries. QA stays separate. A device is not a unique person; client-reported origin is not verified acquisition attribution. No page-view/referrer funnel or payment verification is implemented. No public analytics endpoint exposes personal data.

Claude is enabled only on the separate test backend for all signed-in users after explicit public prompt-transmission approval, with owner-approved test sources: Chaupai 7 and a selected Ramcharitmanas passage. On 17 October 2026, a real signed-in browser request completed and displayed a modern reflection after wording safeguards were tightened. Guest requests remain blocked; the button explains transmission to Anthropic before sending. Requests are capped at 2000 counted input / 500 output tokens with thinking disabled; 1/minute, 5/hour and 10/day per account plus shared limits. The one-shot admin gate remains off. No whole-book prompt or raw concern/output logging. A 390px browser layout was checked; physical iPhone/Pixel acceptance is still needed.

The copied source dataset is retained separately under its upstream ODbL1.0 notice and pinned commit. All seven supplied kanda files are present; this does not establish critical-edition accuracy. Keep ancient original text, new paraphrase, modern reflection and any translation clearly distinct.

Rollout checks use mocked provider responses; no additional paid end-to-end call was made for the public-access update. Anonymous/deleted identities remain blocked; non-QA authentication is covered by tests. The persistent app allowance reserves one cent per attempt, stops at500, keeps failed reservations and has no time-based reset. This is not an account-wide invoice cap.
