$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
# This is the standalone test project. Never use release:test for this address.
$env:VERCEL_PROJECT_ID = 'prj_drDEbqApND925fU4ZC7EXAO2unSC'
$env:VERCEL_ORG_ID = 'team_2Zk0zm7afXNJUtHpHfHc8p7M'
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx vercel@50.28.0 deploy --yes --prod --scope sethimailbox1-9537s-projects --build-env NEXT_PUBLIC_CONVEX_URL=https://successful-lapwing-954.convex.cloud --env NEXT_PUBLIC_CONVEX_URL=https://successful-lapwing-954.convex.cloud
exit $LASTEXITCODE
