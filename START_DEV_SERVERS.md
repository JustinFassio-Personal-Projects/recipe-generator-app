# 🚀 How to Start Development Servers CORRECTLY

## The Right Way

**Production uses Vercel's built-in dev server on port 3000.**  
**Your vite.config.ts proxies API requests to port 3000.**

You should NOT run `vercel dev` separately. Instead:

### Option 1: Use vercel dev ONLY (Recommended)

```bash
vercel dev
```

This starts BOTH the frontend AND API on port 3000.  
Then open http://localhost:3000

### Option 2: Use npm run dev ONLY (If you need port 5174)

```bash
npm run dev
```

This starts Vite on port 5174 and proxies `/api/*` to `http://localhost:3000` where... nothing is running yet!

So you ALSO need to start Vercel dev separately in another terminal.

## The Issue

You were running `npm run dev` (port 5174) but NO vercel dev (port 3000).  
This caused API calls to fail.

## The Fix

Just run:

```bash
vercel dev
```

Then open http://localhost:3000

**That's it.** One command, everything works.
