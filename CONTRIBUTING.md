# Contributing to Git-GPT

Thanks for contributing! This is a small, focused tool — keep changes tight and the existing patterns intact.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your GitHub OAuth credentials
npm run dev
```

## Before you open a PR

Run all three locally — a PR that fails any of these will be bounced:

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest unit tests
npm run build       # production build must compile
```

## Conventions

**Commits** — [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(users): add grid view to people lists
fix(auth): refresh access tokens before expiry
chore(deps): bump next to 15.x
```

- Scope with the area touched (`users`, `auth`, `cleanup`, `crawler`, `i18n`, ...).
- One logical change per commit. No `WIP` or `fix stuff` subjects.

**Code**

- TypeScript strict — no `any` unless the API truly returns untyped data.
- Match the patterns already in the codebase: encrypted session cookies via `lib/auth/crypto`, API routes with `isSameOriginRequest` + `requireAuthenticatedSession`, i18n strings in `lib/i18n/en.ts` (never hardcode user-facing text).
- No unnecessary comments — code should explain itself; comment only non-obvious *why* decisions.
- New user-facing features need translations for all keys they add.

**UI**

- Tailwind utility classes, shadcn/ui components from `components/ui/`.
- Keep the phone-first layout working: check changes at 375px width before assuming desktop is fine.

**Tests**

- Pure logic (formatting, parsing, bulk queues) gets vitest coverage in a colocated `.test.ts` file.
- Bug fixes: add a test that fails without the fix.

## Pull requests

1. Branch from `master`: `git switch -c feat/<short-name>`.
2. Keep PRs small — one feature or one fix.
3. Fill in the PR template. Reference the issue with `Closes #N` when applicable.
4. CI must be green before review.

## Reporting bugs

Use the **Bug report** issue template. Include exact steps, what you expected, and what happened. Screenshots help; never paste tokens or `.env` contents.

## Feature requests

Use the **Feature request** template. Explain the *problem* you're trying to solve, not just the solution you'd like.
