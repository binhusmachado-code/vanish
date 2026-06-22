# Stripe + Supabase Integration Setup

## Prerequisites

- Supabase project: https://supabase.com
- Stripe account: https://stripe.com
- Resend for email: https://resend.com

## 1. Supabase Setup

### Create Database Schema

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Copy & paste contents of `migrations/001_init_schema.sql`
4. Run the query

### Get API Keys

1. Go to Settings → API
2. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role key

## 2. Stripe Setup

### Get Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - `STRIPE_SECRET_KEY` → Secret key (starts with `sk_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Publishable key (starts with `pk_`)

### Configure Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events to send:
   - `checkout.session.completed`
   - `invoice.payment_failed`
5. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

## 3. Environment Variables

Update `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Resend (email)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=VANISH <onboarding@resend.dev>

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Admin
ADMIN_TOKEN=your-secret-admin-token
OPERATOR_ALERT_EMAIL=your-email@example.com
```

## 4. Flow

1. **Customer enters intake form** → POST `/api/intake`
   - Creates customer record in Supabase
   - Creates initial removal run (queued)
   - Returns dashboard URL

2. **Customer chooses plan** → POST `/api/checkout`
   - Creates Stripe session
   - Stores payment record (pending)
   - Returns checkout URL

3. **Customer completes payment** → Stripe webhook
   - Updates customer status to "active"
   - Sends confirmation email via Resend
   - Updates payment record to "completed"

4. **Operator runs removals** → PUT `/api/admin/removal-update`
   - Updates run status
   - Sends progress email to customer

## 5. Test Locally

1. Install dependencies: `npm install`
2. Set up `.env.local` with test keys
3. Run: `npm run dev`
4. Visit http://localhost:4000

For Stripe testing: Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC.

## 6. Deploy to Vercel

1. Set environment variables in Vercel dashboard
2. Deploy: `git push`
3. Update Stripe webhook URL to prod domain
