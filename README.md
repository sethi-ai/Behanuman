# Be Hanuman

A Next.js app for Hanuman Chalisa reading, an optional Sankalp, verse learning and saved practice through Convex Google authentication. Guests can read without an account.

Test app: https://www.behanuman.com/ . Alternate test address: https://be-hanuman-preview.vercel.app/ . The original HTML live app at https://hanuman.dyut.si/ is separate and has not been replaced.

Current testing release: rd7ylcy2l / dpl_AwcAdeiTy9wtszkLc6YSQSHycsv4. See [release status and acceptance gaps](docs/RELEASE-2026-10-17.md).

## Review the app

Open the test link in Safari on iPhone or Chrome on Android. Continue as guest opens reading directly. Google sign-in saves account practice; use the same account on another device. See [reviewer checks](docs/REVIEWER.md) for tested and untested paths.

h.i offers optional Claude reflections on the separate test app for signed-in users. The pilot uses Chaupai 7 with one separately sourced Ramcharitmanas passage, approved for test use. Fixed samples and generated modern interpretations are labelled separately. Be Hanuman does not save typed concerns or generated replies; only fixed story history stays on the device. The full archive is not model context. Wider publication and content expansion remain under review.

## Run locally

Use Node.js22 and npm. Clone this repository, install with npm ci, then copy .env.example to .env.local and configure your own isolated Convex deployment. Run npx convex dev to initialise that project and follow its normal login/setup flow. Put its public cloud URL in NEXT_PUBLIC_CONVEX_URL. In another terminal run npm run dev and open http://localhost:3000/ . Configure Google OAuth and Convex Auth signing variables on your own backend for sign-in; never reuse or request the maintainer’s secrets. A blank or unreachable Convex URL does not provide a complete working app.

Run npm run lint, npm test, npx tsc --noEmit and npm run build for validation. npm run start serves the production build locally. package-lock.json is committed; use npm ci for a consistent dependency install.

## Deployment and sources

This project uses Vercel for the frontend and Convex for backend/auth. The maintainer npm run deploy:preview helper deliberately pins the separate test project. It is not a generic deployment command for clones. Do not run release:test or an unscoped production deploy against the original app.

The original renderer reference is history/html-v1/index.html. Generated public/restored/engine.js and src/restored/body.html come from scripts/restore-original.mjs plus its upgrade helpers. Do not regenerate casually: keep the reviewed source reference and run the full checks afterward.

[Ramcharitmanas.md](Ramcharitmanas.md) contains all seven original-language kanda files from a pinned upstream dataset, including source/license/coverage caveats. It is an archive, not automatically approved model context or a critically verified edition. Raw files, hashes and the retained ODbL licence are in docs/sources/ramcharitmanas/. Modern translation was not added. Each runtime source needs its own editorial and rights review; existing Valmiki stories stay separately attributed.

Do not commit .env.local, credentials, downloaded OAuth JSON, local analytics exports, browser logs, account data or private submission notes. The placeholder .env.example is safe to track. Tests use synthetic in-memory identities.

The signed-in h.i test rollout has a persistent 500-attempt stop. One cent of the $5 app allocation is reserved before each attempt, including failures, without daily reset. This is a conservative app allowance, not an Anthropic account-wide billing cap. Current verified Haiku 5.5 token prices and 2000 input / 500 output limits imply at most $0.00045 in token charges per normal request before tax. Other apps and earlier calls are outside this allowance.
