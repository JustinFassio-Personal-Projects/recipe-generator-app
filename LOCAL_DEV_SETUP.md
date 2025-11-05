# 🛠️ Local Development Setup Guide

## The Problem

Your local development environment requires **TWO servers** to work properly:

1. **Vite Dev Server** (port 5174) - Serves the React frontend
2. **Vercel Dev Server** (port 3000) - Handles API endpoints with serverless functions

When you run only `npm run dev`, the Vite server starts but API calls fail because there's nothing running on port 3000.

## Why Production Works But Local Doesn't

### Production (Vercel)

- ✅ Automatically runs both frontend and API functions
- ✅ OpenAI API key loaded from Vercel environment variables
- ✅ No configuration needed - just works

### Local Development (Requires Setup)

- ❌ Only running Vite server (`npm run dev`)
- ❌ API requests proxy to `http://localhost:3000` (nothing there!)
- ❌ Result: "Unexpected end of JSON input" errors

## 🚀 Quick Start (Easy Way)

Use the provided startup script that handles everything:

```bash
./dev-start.sh
```

This script:

- ✅ Checks for `.env.local` file
- ✅ Cleans up any existing processes
- ✅ Starts Vercel dev server on port 3000
- ✅ Starts Vite dev server on port 5174
- ✅ Handles cleanup on Ctrl+C

## 🔧 Manual Setup (Step by Step)

### 1. Ensure Environment Variables

Create `.env.local` in your project root:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (should already be set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start Vercel Dev Server (Terminal 1)

```bash
vercel dev --listen 3000
```

This starts the API server that handles:

- `/api/ai/chat` - OpenAI chat completions
- `/api/ai/assistant` - OpenAI assistant threads
- `/api/ai/generate-image` - DALL-E image generation
- `/api/recipe-standardize` - Recipe parsing
- `/api/stripe/*` - Stripe payment endpoints

Wait for this message:

```
Ready! Available at http://localhost:3000
```

### 3. Start Vite Dev Server (Terminal 2)

```bash
npm run dev
```

This starts the frontend React app on port 5174.

### 4. Access Your App

Open http://localhost:5174 in your browser.

API requests from the frontend will automatically proxy to the Vercel dev server.

## 🔍 How the Proxy Works

From `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // Forwards to Vercel dev server
    changeOrigin: true,
  },
}
```

When your React app calls `/api/ai/chat`, Vite proxies it to `http://localhost:3000/api/ai/chat`.

## 🐛 Troubleshooting

### "Unexpected end of JSON input"

**Cause**: Vercel dev server not running on port 3000  
**Fix**: Run `vercel dev --listen 3000` in a separate terminal

### "API key not configured"

**Cause**: Missing `.env.local` file or `OPENAI_API_KEY` not set  
**Fix**: Create `.env.local` with your OpenAI API key

### Port 3000 already in use

**Cause**: Another process is using port 3000  
**Fix**: Kill the process or use a different port

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
vercel dev --listen 3001

# Update vite.config.ts proxy target to match
```

### Port 5174 already in use

**Cause**: Previous Vite server still running  
**Fix**: Kill the process

```bash
lsof -ti:5174 | xargs kill -9
```

## 📝 Common Workflows

### Starting Development

```bash
# Option 1: Use the script
./dev-start.sh

# Option 2: Manual (two terminals)
# Terminal 1:
vercel dev --listen 3000

# Terminal 2:
npm run dev
```

### Stopping Development

```bash
# If using script: Press Ctrl+C

# If manual: Press Ctrl+C in both terminals
```

### Testing API Endpoints

```bash
# Test OpenAI chat endpoint
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"persona":"chef"}'

# Test health endpoint
curl http://localhost:3000/api/health
```

## 📚 Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vite Configuration](https://vitejs.dev/config/)
- [API Setup Guide](./API_SETUP.md)

## ✅ Checklist

Before starting development, ensure:

- [ ] `.env.local` file exists with `OPENAI_API_KEY`
- [ ] Vercel CLI is installed (`vercel --version`)
- [ ] Node.js version 20+ is installed (`node --version`)
- [ ] Dependencies are installed (`npm install`)
- [ ] Ports 3000 and 5174 are available

## 🎯 TL;DR

**You need TWO servers running:**

1. `vercel dev --listen 3000` (API)
2. `npm run dev` (Frontend)

**Or just run:**

```bash
./dev-start.sh
```

Done! 🎉
