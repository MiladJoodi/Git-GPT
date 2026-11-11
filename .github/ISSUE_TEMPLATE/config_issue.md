---
name: Config / OAuth problem
about: Sign-in fails, OAuth errors, session issues
title: "config: "
labels: config
---

**What happens?**
Which step fails — sign-in redirect, callback, session expiry, account switch?

**Error message**
The exact error text or the `?error=` value shown on `/login`.

**Environment**
- Hosting (local dev / Vercel / Railway / VPS):
- Browser:

**Checklist**
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env.local`
- [ ] The OAuth app callback URL matches my deployed origin
- [ ] `SESSION_SECRET` is set
- [ ] (Crawler) `DATABASE_URL` is reachable

**Additional context**
Anything else that might matter. Never paste real secrets.
