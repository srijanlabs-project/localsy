# Deployment, Git Integration & UAT Guide

This document explains how to connect this project to GitHub, provision PostgreSQL, and deploy on Railway.

---

## 1. Push Code to GitHub

If needed:

```bash
git init
git add .
git commit -m "feat: project setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 2. Provision PostgreSQL

Recommended providers:
- Railway
- Supabase
- Neon

Use `DATABASE_SCHEMA.md` to create tables and indexes.
Use `SEED_DATA.sql` to seed initial data.

---

## 3. Deploy on Railway

This repo uses a Node/Express runtime to serve built Vite assets.

1. Connect repository in Railway (`New Project` -> `GitHub Repo`).
2. Set build/start commands:
- Build: `npm run build`
- Start: `npm run start`
3. Set variables:
- `NODE_ENV=production`
- `PORT=3000` (or Railway-managed dynamic port)
- `DATABASE_URL` (if using database)
- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` as required

If deployment fails with "Application failed to respond", verify the app binds to `0.0.0.0` and `process.env.PORT`.

---

## 4. Optional Full-Stack Extension

If you move logic server-side, keep static frontend build plus API routes in Express, and deploy as a single Railway service.