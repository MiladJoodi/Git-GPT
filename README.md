# Git-GPT

Find and unfollow GitHub users who don't follow you back — plus follower history, repository cleanup, an auto-follow crawler, and more.

> **v0.3.0** — now with a responsive desktop layout, multi-account support, auto follow-back, list sorting and grid view, and accent color themes.

## Features

**People**
* 🔍 Compare Followers and Following, find users who don't follow you back
* ☑️ Select multiple users, unfollow in bulk with progress and retry
* 🔄 **Auto follow-back** — follow everyone who follows you but isn't followed yet, in one tap
* 👥 **Multi-account** — keep up to 5 accounts signed in and switch instantly
* 🔀 **Sort & view** — sort people by username or relationship, switch between list and grid

**Repositories**
* ⭐ Star repositories from any profile
* 🧹 Clean up stars and forks — spot stale repos, check a fork against its upstream, unstar/archive/delete in bulk
* 📊 Follower history — see who started or stopped following you since you began watching

**Interface**
* 🖥️ Responsive layout — works on phone and desktop
* 🎨 Accent color themes (Default, Forest, Ocean, Rose, Amber) with light and dark modes
* 🔐 GitHub OAuth — no GitHub password required

## How It Works

1. Sign in with your GitHub account.
2. Git-GPT fetches your Followers and Following lists.
3. The app compares both lists.
4. Users who don't follow you back are displayed.
5. Select the users you want to remove.
6. Unfollow them directly through GitHub.

The app uses GitHub's official REST API for follower/following data and follow/star management. Explore and Stars features also read public GitHub HTML for list extraction.

## Getting Started

```bash
npm install
cp .env.example .env.local   # add your OAuth credentials
npm run dev
```

Requires GitHub OAuth app credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`) — see `.env.example`.

### Crawler (optional)

The crawler auto-follows latest followers in waves. It runs as a **separate Node process** and stores queue/state in Neon PostgreSQL (`DATABASE_URL`). Closing the browser does not stop it.

1. Add `DATABASE_URL` to `.env.local` (never commit it).
2. Apply schema: `npm run db:push` (or run `drizzle/0000_crawler.sql`).
3. Start the app: `npm run dev` (or `npm run start`).
4. In another terminal: `npm run crawler:worker`.
5. Open `/crawler` → Start.

On Vercel (or other serverless hosts), deploy the **web app** there and run `npm run crawler:worker` on a long-running host (Railway, Fly, VPS) with the same `DATABASE_URL`, `SESSION_SECRET`, and GitHub OAuth env vars.

## Tech Stack

* Next.js (App Router)
* React + TypeScript
* Tailwind CSS
* Drizzle ORM + PostgreSQL (crawler, follower history)
* GitHub REST API + OAuth

## Development

```bash
npm run dev        # start the dev server
npm run test       # vitest unit tests
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build
```

Before opening a PR, run `npm run typecheck`, `npm run test`, and `npm run build`. See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions.

## Security

Git-GPT uses GitHub OAuth instead of asking for your GitHub password.

The application requests `read:user`, `user:follow`, `public_repo`, and `delete_repo` so it can manage follows, star public repositories, and delete owned forks from cleanup. It does not need access to private repository contents. Existing users must sign out and sign in again (re-authorize) after `delete_repo` is added.

## Contributing

Contributions are welcome! Check [CONTRIBUTING.md](CONTRIBUTING.md) and open an issue using the templates before larger changes.

If you find it useful, consider giving the repository a ⭐.
