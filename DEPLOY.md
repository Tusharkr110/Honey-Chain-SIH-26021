# Deploy Bharat Bee HoneyChain (GitHub -> Vercel)

## 1. Push to GitHub
Create an EMPTY repo on github.com (no README), then in this folder:

    git init
    git add .
    git commit -m "HoneyChain: initial commit"
    git branch -M main
    git remote add origin https://github.com/<your-username>/<repo-name>.git
    git push -u origin main

## 2. Import in Vercel
Vercel -> Add New -> Project -> import the repo.
Framework Preset: "Other". Leave Build Command / Output Directory EMPTY. Deploy.

## 3. Add the shared ledger database (REQUIRED for QR scans from other phones)
Project -> Storage -> Create Database -> Upstash (Redis, free plan) -> Connect to Project.
Vercel injects KV_REST_API_URL + KV_REST_API_TOKEN automatically.
Then Deployments -> latest -> Redeploy so the env vars are picked up.

## 4. Set PUBLIC_URL
Open https://<project>.vercel.app , then put it in app.js:  PUBLIC_URL: 'https://<project>.vercel.app'
Commit + push (Vercel redeploys on every push).

## 5. Turn OFF Vercel Authentication for production
Settings -> Deployment Protection -> Vercel Authentication -> Disabled (otherwise phones see a login wall).

## 6. Test
Admin login: admin / honeychain2026. Create a batch, finish the steps, scan its QR on a phone using mobile data.
Health check: open https://<project>.vercel.app/api/state -> should return JSON {"chains":...}
(If it says "Storage not configured", redo step 3.)

Optional: env var RESET_KEY=<secret>, then send  DELETE /api/state?key=<secret>  to wipe the ledger before a demo.
Local run (Windows): double-click start.bat
