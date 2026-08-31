# GitHub Follow Manager

A production-ready utility that connects to your GitHub account, shows who you follow that does not follow you back, and lets you unfollow those accounts safely.

This is a real GitHub integration. There is no mock login and no fake follower data.

## Local development

### 1. Install

```bash
npm install
```

### 2. Create a GitHub OAuth App

1. Open [GitHub Developer Settings](https://github.com/settings/developers)
2. Choose **OAuth Apps** → **New OAuth App**
3. Use:

| Field | Local value |
| --- | --- |
| Application name | GitHub Follow Manager |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/github/callback` |

4. Copy the **Client ID** and generate a **Client Secret**

Requested scopes at authorize time: `read:user`, `user:follow`, `offline_access`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```text
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=generate_a_long_random_string
```

Generate a session secret:

```bash
openssl rand -base64 48
```

`SESSION_SECRET` must be at least 32 characters.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose **Continue with GitHub**.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
```
