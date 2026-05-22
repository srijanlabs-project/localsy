# 🚀 Deployment, Git Integration & UAT Guide

This document details how to export your code, link it directly to your GitHub repository, configure/provision a relational PostgreSQL database, and host the entire system on **Railway** for User Acceptance Testing (UAT).

---

## 🔗 1. How to Connect & Push Code to GitHub

Since you are running in the **AI Studio** interactive ecosystem, you can connect your code to Git instantly:

1. **Locate the Settings & Export menu** in the top-right corner of the AI Studio workspace.
2. Select **"Export to GitHub"**.
3. Authenticate with your GitHub account when prompted.
4. Select whether to create a **New Repository** (e.g., `rahul-yellow-pages-uat`) or map to an existing one.
5. AI Studio will immediately run a push of all workspace files (including our newly written `DATABASE_SCHEMA.md` and this deployment guide) to your personal branch.

*Alternatively, if you download the ZIP file:*
```bash
# Initialize local repo
git init

# Add remote matching your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Stage and commit files
git add .
git commit -m "feat: complete compliant audit logs, spatial structures & deployment prep"

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 🗄️ 2. Provisioning Your PostgreSQL Database

For UAT, you can spin up a fully managed PostgreSQL database with 1-click on any of these high-performance providers:

### Option A: Railway (Recommended - Unified billing and hosting)
1. Log into your [Railway Console](https://railway.app/).
2. Click **"New Project"** ➔ **"Provision PostgreSQL"**.
3. Once initialized, click on the PostgreSQL card, navigate to the **Variables** tab, and copy your default **`DATABASE_URL`** connection string:
   `postgresql://postgres:randompassword@host:port/railway`
4. Access the **Data** tab in Railway, and run the complete SQL DDL provided in our [`DATABASE_SCHEMA.md`](/DATABASE_SCHEMA.md) file to establish your collections and tables.

#### ⚠️ Troubleshooting: "Failed to create TCP proxy, please try again" on Railway
If you encounter this specific error when adding a public TCP connection or trying to access the PostgreSQL instance externally, here is the direct solution:
*   **Cause 1: Guarded Verification Limit:** Railway restricts public TCP proxy mappings on completely anonymous free accounts to prevent spam abuses. To unlock TCP ports, navigate to your **Account Settings ➔ Billing / Verification** and verify your account with a credit card (no charges will be made on the free tier) or upgrade to a Hobby plan ($5/mo).
*   **Cause 2: Shared Port Exhaustion:** Shared regions sometimes run out of available proxy ports. 
*   **Workaround 1: Use Internal Networking (No TCP Proxy Needed!)**
    If your application code (Express/Node or server API) is hosted in the **same Railway project**, you do **not** need a public TCP proxy! They communicate privately and securely over Railway's internal network. Simply refer to the database in your variable tab using the standard placeholder variables (`${{Postgres.DATABASE_URL}}` or `${{postgress_service_name.HOST}}`).
*   **Workaround 2: Use Neon.tech or Supabase (Completely Free & No TCP Restrictions!)**
    If you do not want to add a card to Railway for verification, use **Neon** (https://neon.tech) or **Supabase** (https://supabase.com). Both provide fully featured cloud PostgreSQL instances on generous free tiers that come with standard, unrestricted public connection strings out of the box!

### Option B: Supabase (Free tier PostgreSQL)
1. Sign up on [Supabase](https://supabase.com/).
2. Select **"New Project"** and set Indian regional database nodes (e.g., Mumbai, AWS ap-south-1).
3. Go to **SQL Editor** inside Supabase, copy the contents of our `DATABASE_SCHEMA.md`, and execute it to generate all indexes, triggers, and municipal state masters.

---

## ☁️ 3. Deploying Your App on Railway for UAT (New Full-Stack Setup)

Our app has been updated to run as a **Full-Stack Express + Vite** application to serve pages reliably and handle server/API endpoints (such as database sync and proxying safely). Here is how to configure Railway to build and launch it instantly:

### Step 1: Connect & Push Your Latest Code
Since we just created `server.ts` and updated `package.json`, **you must push/export these changes to your GitHub branch first**:
1. Inside AI Studio, click **"Export to GitHub"** in the top-right settings/export menu of the workspace.
2. Ensure the branch connected to your Railway project (usually `main`) receives the new files (`server.ts` and the updated `package.json`).

### Step 2: Configure Service Settings in Railway
Because this is now a **standard Node/Express application** (not a Static deployment anymore), ensure the service is configured dynamically:
1. **Change Deployment/Build Settings**:
   * **Build Command**: Set to `npm run build`
   * **Start Command**: Set to `npm run start` (or `npm start`)
2. **Configure Port Mapping**:
   * Go to **Settings** ➔ **Networking** in Railway.
   * Under **Port**, ensure it is configured to use port **`3000`** (or left to reference your `PORT` environment variable which defaults to `3000`).
   * *Why?* Railway expects the web container to bind to a port so that outward HTTP traffic can route in. Since we listen to `process.env.PORT` or fall back to `3000`, setting the Custom Port here ensures perfect proxy routing.

### Step 3: Configure Environment Variables
Inside Railway's **Variables** tab for your service, add the following variables:
*   `NODE_ENV` ➔ `production`
*   `PORT` ➔ `3000`
*   `DATABASE_URL` ➔ `(your PostgreSQL connection string if using database)`
*   `GEMINI_API_KEY` ➔ `(your Gemini model developer API key, if needed)`

---

## 🛠️ 4. Full-Stack / Middle-tier Server Integration (Optional REST API)

If you plan to scale up to an Express backend rather than keeping everything cached in the client's local memory, you can easily shift into our supported full-stack structure.

Simply expand your `package.json` parameters as follows:
```json
"scripts": {
  "dev": "tsx server.ts",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs"
}
```

Railway will automatically run `npm run build` during step deployment and launch your Node server securely, bounding immediately to port `3000` via dynamic reverse proxying.
