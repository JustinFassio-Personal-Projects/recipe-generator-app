# ChatKit Initialization Troubleshooting

## Issue: ChatKit Stuck in Initialization Loop

### Symptoms

- Console shows repeated `[ChatKit] getClientSecret called` messages
- Session creation succeeds but ChatKit UI doesn't appear
- Domain verification warnings in console
- "Initializing ChatKit session..." message persists

### Root Causes Identified

1. **Infinite Re-renders**: React StrictMode or component remounting causing repeated session creation
2. **Domain Verification**: Localhost not in domain allowlist causing silent failures
3. **Session Management**: ChatKit requesting new sessions instead of using existing ones

### Fixes Applied

#### 1. Session Creation Guards ✅

Added multiple layers of protection against infinite loops:

```typescript
// Track session creation per workflow
const sessionCreatedRef = useRef<string | null>(null);
const initializationAttempts = useRef(0);

// Prevent duplicate sessions
if (sessionCreatedRef.current === currentWorkflowId) {
  throw new Error('Session already exists');
}

// Limit attempts
if (initializationAttempts.current > 3) {
  throw new Error('Too many initialization attempts');
}

// Prevent concurrent creations
if (isCreatingSession && !existing) {
  throw new Error('Session creation already in progress');
}
```

#### 2. Domain Allowlist (Required for Production)

**Development (localhost)**:

- Domain verification is skipped automatically
- Warning is informational only
- Should work without allowlist

**Production**:

- MUST add your domain to OpenAI's domain allowlist
- Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
- Add your production domain (e.g., `recipegenerator.app`)

### Testing Steps

1. **Clear Browser State**:

   ```bash
   # Clear cache and reload
   # Or use incognito/private window
   ```

2. **Start Fresh**:

   ```bash
   npm run dev
   ```

3. **Navigate to Agent Page**:
   - Go to `http://localhost:5174/agent-recipe`
   - Select "BBQ Pitmaster"

4. **Watch Console**:

   ```
   ✅ Should see 1-2 session creation attempts
   ✅ Should see "ChatKit initialized successfully"
   ✅ Should see "Domain verification skipped" (this is OK)
   ❌ Should NOT see repeated session creations (>3)
   ```

5. **Expected Behavior**:
   - Loading indicator appears briefly
   - ChatKit interface loads within 3-5 seconds
   - Chat input and messages area visible
   - "Save Recipe" button appears in header

### If Still Not Working

#### Option 1: Check React StrictMode

React StrictMode in development causes double-renders which can trigger the issue.

Edit `src/main.tsx`:

```typescript
// Temporarily disable StrictMode for testing
// <React.StrictMode>
  <App />
// </React.StrictMode>
```

#### Option 2: Check Browser Extensions

Some extensions (ad blockers, privacy tools) can block ChatKit:

- Disable extensions
- Try incognito/private mode
- Check browser console for blocked requests

#### Option 3: Verify API Key Permissions

```bash
# Run the test script
node scripts/test-chatkit-session.js

# Should output:
# ✅ OpenAI API key is valid and working
# ✅ ChatKit session created
# ✅ ChatKit is fully functional!
```

#### Option 4: Check Network Tab

Open browser DevTools → Network:

- Filter by "chatkit"
- Look for `/api/ai/chatkit-session` requests
- Should see 1-2 successful (200) responses
- Check response has `client_secret` field

### Logs to Look For

**Good**:

```
[ChatKit] getClientSecret called: { attempts: 1 }
[ChatKit] Creating new session for workflow: wf_...
[ChatKit] Session created successfully
[AgentRecipePage] ChatKit initialized successfully
```

**Bad (Infinite Loop)**:

```
[ChatKit] getClientSecret called: { attempts: 1 }
[ChatKit] getClientSecret called: { attempts: 2 }
[ChatKit] getClientSecret called: { attempts: 3 }
[ChatKit] getClientSecret called: { attempts: 4 }  ← This should now be prevented
```

**Error (Stopped)**:

```
[ChatKit] Too many initialization attempts, stopping
ChatKit Error: ChatKit initialization failed after multiple attempts
```

### Known Limitations

1. **Localhost Domain Verification**: Warning is expected and harmless in development
2. **Session Limit**: Max 3 attempts per agent selection to prevent loops
3. **Concurrent Sessions**: Only one session creation at a time per workflow

### Alternative: Use Chat Completions API

If ChatKit continues to have issues, the proven alternative is available:

- Navigate to `/chat-recipe` instead
- Uses standard Chat Completions API
- Similar functionality without ChatKit complexity
- Already working in production

### Production Checklist

Before deploying to production:

- [ ] Add production domain to OpenAI allowlist
- [ ] Test with production domain (not localhost)
- [ ] Verify CSP allows `cdn.platform.openai.com`
- [ ] Check OPENAI_API_KEY environment variable
- [ ] Test session creation in production environment

### Support

If issues persist after trying these steps:

1. Check browser console for specific error messages
2. Review Network tab for failed requests
3. Verify OpenAI API key has ChatKit beta access
4. Contact OpenAI support for ChatKit-specific issues
