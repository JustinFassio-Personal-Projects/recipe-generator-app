# Resend Setup Guide

This guide walks through setting up Resend for the Recipe Generator email system.

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
   - Free tier includes: 3,000 emails/month, 100 emails/day
   - No credit card required for free tier

## Step 2: Verify Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `recipegenerator.app`
4. Resend will provide DNS records to add

### Required DNS Records

Add these records to your DNS provider (where recipegenerator.app is hosted):

#### SPF Record

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### DKIM Records

Resend will provide 3 DKIM records like:

```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this value]
```

#### DMARC Record (Optional but recommended)

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:justin@recipegenerator.app
```

### Verify Domain Status

1. After adding DNS records, wait 5-10 minutes for propagation
2. Click **Verify** in Resend dashboard
3. Status should change to **Verified** (green checkmark)

## Step 3: Configure Sender Email

1. In Resend dashboard, the default sender will be: `justin@recipegenerator.app`
2. You can also configure:
   - Display name: "Recipe Generator"
   - Reply-to: `justin@recipegenerator.app`

## Step 4: Generate API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `Recipe Generator Production`
4. Select permission: **Sending access**
5. Copy the API key (it will only be shown once)

**Example format:** `re_123456789abcdefghijklmnop`

## Step 5: Store API Key in Supabase

### For Local Development:

Create or update `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
```

### For Production (Supabase):

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_api_key_here`

Or use the Supabase CLI:

```bash
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

## Step 6: Test Email Sending

Once setup is complete, you can test with a simple curl command:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "justin@recipegenerator.app",
    "to": "your-test-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from Recipe Generator!</p>"
  }'
```

## Monitoring & Analytics

Resend provides:

- **Email Logs**: View all sent emails
- **Delivery Status**: Track deliveries, bounces, complaints
- **Webhooks**: Get notified of email events (optional)

Access these in the Resend dashboard under **Emails** and **Analytics**.

## Webhook Setup (Optional)

To track email opens and clicks:

1. In Resend dashboard, go to **Webhooks**
2. Click **Add Webhook**
3. Enter your endpoint: `https://your-project.supabase.co/functions/v1/email-webhook`
4. Select events: `email.sent`, `email.delivered`, `email.bounced`, `email.opened`, `email.clicked`
5. Save the webhook

This will allow you to update `email_logs` table with engagement data.

## Rate Limits

**Free Tier:**

- 3,000 emails/month
- 100 emails/day
- Rate limit: 10 emails/second

**Paid Plans:**

- Start at $20/month for 50,000 emails
- Custom rate limits
- Priority support

## Troubleshooting

### Domain Not Verifying

- Check DNS records are correct (no typos)
- Wait 24 hours for DNS propagation
- Use `dig` or `nslookup` to verify DNS records are live

### Emails Going to Spam

- Ensure SPF, DKIM, and DMARC are properly configured
- Start with small volumes to build sender reputation
- Add unsubscribe links to all marketing emails

### API Key Not Working

- Ensure you copied the full key (starts with `re_`)
- Check key permissions include "Sending access"
- Verify key is not expired or revoked

## Next Steps

After completing this setup:

1. ✅ Domain verified
2. ✅ API key generated and stored
3. ✅ Ready to implement Edge Functions that use Resend

Proceed to Phase 3: React Email Templates setup.
