# Be Hanuman

A Next.js app for Hanuman Chalisa reading, an optional Sankalp, verse learning and saved practice through Convex Google authentication. Guests can read without an account.

Test app: https://www.behanuman.com/ . Alternate test address: https://be-hanuman-preview.vercel.app/ . The original HTML live app at https://hanuman.dyut.si/ is separate and has not been replaced.

## Review the app

Open the test link in Safari on iPhone or Chrome on Android. Continue as guest opens reading directly. Google sign-in saves account practice; use the same account on another device. See [reviewer checks](docs/REVIEWER.md) for tested and untested paths.

h.i currently shows labelled fixed editorial samples. Claude is connected on the separate test backend, but live generation remains disabled pending content/rights approval and a paid end-to-end response test. Do not infer live AI from a configured provider key.

## Run locally

Use Node.js22 and npm. Clone this repository, install with npm ci, then copy .env.example to .env.local and configure your own isolated Convex deployment. Run npx convex dev to initialise that project and follow its normal login/setup flow. Put its public cloud URL in NEXT_PUBLIC_CONVEX_URL. In another terminal run npm run dev and open http://localhost:3000/ . Configure Google OAuth and Convex Auth signing variables on your own backend for sign-in; never reuse or request the maintainer’s secrets. A blank or unreachable Convex URL does not provide a complete working app.

Run npm run lint, npm test, npx tsc --noEmit and npm run build for validation. npm run start serves the production build locally. package-lock.json is committed; use npm ci for a consistent dependency install.

## Deployment and sources

This project uses Vercel for the frontend and Convex for backend/auth. The maintainer npm run deploy:preview helper deliberately pins the separate test project. It is not a generic deployment command for clones. Do not run release:test or an unscoped production deploy against the original app.

The original renderer reference is history/html-v1/index.html. Generated public/restored/engine.js and src/restored/body.html come from scripts/restore-original.mjs plus its upgrade helpers. Do not regenerate casually: keep the reviewed source reference and run the full checks afterward.

[Ramcharitmanas.md](Ramcharitmanas.md) contains all seven original-language kanda files from a pinned upstream dataset, including source/license/coverage caveats. It is an archive, not automatically approved model context or a critically verified edition. Raw files, hashes and the retained ODbL licence are in docs/sources/ramcharitmanas/. Modern translation was not added. Each runtime source needs its own editorial and rights review; existing Valmiki stories stay separately attributed.

Do not commit .env.local, credentials, downloaded OAuth JSON, local analytics exports, browser logs, account data or private submission notes. The placeholder .env.example is safe to track. Tests use synthetic in-memory identities.
