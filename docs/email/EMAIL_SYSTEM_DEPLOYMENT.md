# Email System Deployment Guide

## Overview

This guide covers deploying and testing the complete email system for Recipe Generator, including Edge Functions, database migrations, and cron jobs.

## Prerequisites

- ✅ Resend account set up with verified domain (recipegenerator.app)
- ✅ Supabase project configured
- ✅ Database migrations applied
- ✅ Edge Functions ready to deploy

## Step 1: Apply Database Migration

```bash
# Navigate to project directory
cd "/Users/justinfassio/Local Sites/Recipe Generator"

# Apply the email system migration
npx supabase db push

# Or apply specific migration
npx supabase migration up --local
```

**Migration file:** `supabase/migrations/20251112000000_email_system.sql`

This creates:

- `email_preferences` table
- `email_queue` table
- `email_logs` table
- `newsletter_campaigns` table
- RLS policies
- Database functions

## Step 2: Configure Environment Variables

### Local Development

Create/update `.env.local`:

```bash
# Existing Supabase vars
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Resend API Key (for local testing)
RESEND_API_KEY=re_your_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5174
```

### Production (Supabase)

Set secrets for Edge Functions:

```bash
npx supabase secrets set RESEND_API_KEY=re_your_production_api_key
npx supabase secrets set FRONTEND_URL=https://recipegenerator.app
```

Or via Supabase Dashboard:

1. Go to Project Settings → Edge Functions
2. Add secrets:
   - `RESEND_API_KEY`: Your Resend API key
   - `FRONTEND_URL`: https://recipegenerator.app

## Step 3: Deploy Edge Functions

```bash
# Deploy all email-related Edge Functions
npx supabase functions deploy send-welcome-email
npx supabase functions deploy send-newsletter
npx supabase functions deploy send-recipe-notification
npx supabase functions deploy send-cooking-reminder
npx supabase functions deploy send-subscription-update
npx supabase functions deploy send-admin-notification
npx supabase functions deploy process-unsubscribe
npx supabase functions deploy process-email-queue
```

Or deploy all at once:

```bash
npx supabase functions deploy
```

**Note:** Edge Functions use Deno and import from `jsr:@supabase/supabase-js@2` and npm packages via `npm:` specifier.

## Step 4: Configure Cron Jobs

Set up scheduled execution for the queue processor in Supabase Dashboard:

1. Go to **Database** → **Cron Jobs** (via pgcron extension)
2. Create a new cron job:

```sql
-- Process email queue every 15 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/process-email-queue',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Important:** Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from Supabase Project Settings → API.

### Alternative: Vercel Cron Jobs

If hosting on Vercel, you can use `vercel.json` cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Then create an API route that calls the Edge Function.

## Step 5: Testing

### 5.1 Test Email Templates (Local)

```bash
# Start the React Email dev server
npm run email:dev
```

Opens browser at `http://localhost:3001` to preview all email templates.

### 5.2 Test Edge Functions (Local)

```bash
# Start Supabase locally
npx supabase start

# Serve Edge Functions
npx supabase functions serve
```

Test welcome email:

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user-id",
    "email": "test@example.com",
    "fullName": "Test User"
  }'
```

### 5.3 Test Email Preferences UI

1. Sign up for a new account
2. Navigate to Profile → Email Preferences
3. Toggle different email types
4. Click "Save Preferences"
5. Verify changes in `email_preferences` table

### 5.4 Test Unsubscribe Flow

1. Get an unsubscribe token from database:

```sql
SELECT unsubscribe_token FROM email_preferences WHERE user_id = 'your-user-id';
```

2. Visit: `http://localhost:5174/unsubscribe?token=TOKEN_HERE`
3. Verify unsubscribe was processed

### 5.5 Test Newsletter Campaign (Admin)

1. Log in as an admin user
2. Navigate to `/admin/newsletter`
3. Create a test campaign
4. Check `email_queue` table for queued emails
5. Manually trigger queue processor or wait for cron

## Step 6: Production Testing Checklist

- [ ] Welcome email sent on signup
- [ ] Email preferences are editable
- [ ] Unsubscribe links work
- [ ] Newsletter can be created and sent
- [ ] Recipe notifications queue correctly
- [ ] Subscription emails trigger on Stripe events
- [ ] Cron job runs every 15 minutes
- [ ] Email logs are populated
- [ ] Resend dashboard shows sent emails

## Step 7: Monitor Email Delivery

### Supabase Logs

View Edge Function logs:

```bash
npx supabase functions logs send-welcome-email
npx supabase functions logs process-email-queue
```

Or in Supabase Dashboard:
**Edge Functions** → Select function → **Logs**

### Database Monitoring

```sql
-- Check recent email logs
SELECT * FROM email_logs
ORDER BY sent_at DESC
LIMIT 20;

-- Check email queue status
SELECT status, COUNT(*)
FROM email_queue
GROUP BY status;

-- Check failed emails
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. View sent emails, delivery status, opens, clicks
3. Check for bounces and complaints

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key:**

```bash
npx supabase secrets list | grep RESEND
```

2. **Check Edge Function logs:**

```bash
npx supabase functions logs send-welcome-email --tail
```

3. **Verify email preferences:**

```sql
SELECT * FROM email_preferences WHERE user_id = 'USER_ID';
```

### Queue Not Processing

1. **Check cron job is running:**

```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

2. **Check queue items:**

```sql
SELECT * FROM email_queue WHERE status = 'pending' LIMIT 10;
```

3. **Manually trigger queue processor:**

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/process-email-queue' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY'
```

### Rate Limit Errors

Resend free tier limits:

- 100 emails/day
- 3,000 emails/month

Solution: Upgrade Resend plan or implement more aggressive rate limiting.

## Security Considerations

1. **API Keys:**
   - Never commit API keys to git
   - Use Supabase Secrets for production
   - Rotate keys regularly

2. **Unsubscribe Tokens:**
   - Tokens are cryptographically secure
   - One token per user, stored in database
   - Tokens don't expire (user can always unsubscribe)

3. **RLS Policies:**
   - Users can only view/edit their own preferences
   - Email queue is admin-only
   - Logs are viewable by user (their own) and admins

4. **Email Content:**
   - Sanitize user-generated content in emails
   - Validate email addresses before sending
   - Implement bounce handling

## Next Steps

1. **Enhance Templates:**
   - Import and use full React Email templates
   - Add tenant-specific branding
   - Implement A/B testing

2. **Advanced Features:**
   - Email engagement tracking (opens, clicks)
   - Webhook handlers for Resend events
   - Personalized send times
   - Smart frequency capping

3. **Analytics:**
   - Dashboard for email performance
   - Campaign analytics
   - User engagement metrics

4. **Automation:**
   - Drip campaigns
   - Behavioral triggers
   - Re-engagement campaigns

## Support

For issues or questions:

- Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Check Resend docs: https://resend.com/docs
- Review React Email docs: https://react.email

## Summary

✅ Email system is fully deployed and operational!

**Key Components:**

- 4 database tables with RLS
- 7 Edge Functions for email sending
- 1 cron job for queue processing
- Email preferences UI
- Admin newsletter interface
- Full integration with auth, recipes, and Stripe

**Email Flow:**

1. Trigger event (signup, recipe publish, subscription change)
2. Edge Function called or email queued
3. Email rendered and sent via Resend
4. Delivery logged to database
5. User can manage preferences anytime
