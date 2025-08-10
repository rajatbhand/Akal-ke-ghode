# Showrunner

## Deploy to Vercel (Postgres + Pusher)

1) Create a Postgres database (Vercel Postgres/Neon) and get the connection string.
   - Set `DATABASE_URL` in Vercel Project → Settings → Environment Variables.

2) Create a Pusher app and set:
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
   - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (same key/cluster)

3) On first deploy, run DB migrations against Postgres:
   - Locally (with DATABASE_URL set to Postgres):
     ```bash
     npx prisma migrate deploy
     ```
   - Or add a Vercel deploy hook/command to run `prisma migrate deploy`.

4) Routes to share:
   - `/display` (big screen)
   - `/control` (operator)
   - `/audience` (public QR link)

Notes:
- Dev uses Socket.IO; prod uses Pusher for realtime.
- Audience voting is a simple OPEN/CLOSED toggle; one submission per phone.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
