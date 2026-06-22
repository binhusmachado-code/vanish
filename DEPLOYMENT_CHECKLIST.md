# VANISH Production Deployment Checklist

## Phase 1: Supabase Setup (5 min)

- [ ] Create Supabase project at https://supabase.com
- [ ] Go to SQL Editor
- [ ] Paste contents of `migrations/001_init_schema.sql`
- [ ] Execute (creates customers, removal_runs, payments tables)
- [ ] Go to Settings → API
- [ ] Copy:
  - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key
  - `SUPABASE_SERVICE_ROLE_KEY` → service_role key

## Phase 2: Stripe Setup (10 min)

### Live Keys
- [ ] Go to https://dashboard.stripe.com/apikeys
- [ ] Copy:
  - `STRIPE_SECRET_KEY` → Secret key (live, starts with `sk_live_`)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Publishable key (live, starts with `pk_live_`)

### Webhook
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Events to send:
  - ✓ checkout.session.completed
  - ✓ invoice.payment_failed
- [ ] Copy `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

## Phase 3: Email Setup (5 min)

- [ ] Create Resend account at https://resend.com
- [ ] Verify your domain (or use free onboarding@resend.dev subdomain)
- [ ] Copy `RESEND_API_KEY`
- [ ] Set `EMAIL_FROM=VANISH <onboarding@resend.dev>` (or your domain)

## Phase 4: Vercel Deployment (10 min)

### Create Project
- [ ] Go to https://vercel.com
- [ ] Import repository (GitHub)
- [ ] Select vanish repo

### Environment Variables
Set in Vercel dashboard:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Email
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=VANISH <onboarding@resend.dev>

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Admin (for operator endpoints)
ADMIN_TOKEN=<generate-random-secure-token>
OPERATOR_ALERT_EMAIL=your-email@example.com
```

- [ ] Deploy

### Post-Deployment
- [ ] Get Vercel deployment URL
- [ ] Update Stripe webhook URL to production domain
- [ ] Test webhook delivery in Stripe dashboard

## Phase 5: Testing (15 min)

### Scan Page
- [ ] Visit https://yourdomain.com/scan
- [ ] Submit email → should return scan results

### Intake Flow
- [ ] Visit https://yourdomain.com/start
- [ ] Fill out form completely
- [ ] Submit
- [ ] Check Supabase: customers table should have new record
- [ ] Get dashboard URL from response
- [ ] Visit dashboard → should show "queued" status

### Checkout Flow
- [ ] On start flow, click "Choose plan"
- [ ] Submit Stripe checkout
- [ ] Use test card: 4242 4242 4242 4242, any future date, any CVC
- [ ] Complete payment
- [ ] Watch Vercel logs for webhook receipt
- [ ] Check Supabase: payments table should show "completed"
- [ ] Check email: should receive confirmation from Resend

### Dashboard
- [ ] Visit customer dashboard URL
- [ ] Verify removal progress displays
- [ ] Verify "Check your inbox" section appears

## Phase 6: Legal & Security (10 min)

- [ ] Privacy policy live at /privacy ✓
- [ ] Terms of service live at /terms ✓
- [ ] Footer links to both pages
- [ ] GDPR/CCPA notice in footer (optional)

## Phase 7: Go Live (5 min)

- [ ] Update DNS to point to Vercel
- [ ] Test live domain
- [ ] Add to Google Search Console
- [ ] Set up monitoring/alerts
- [ ] Brief operator on dashboard access

## Monitoring Checklist

- [ ] Vercel logs: watch for errors
- [ ] Stripe dashboard: webhook failures
- [ ] Supabase: query performance
- [ ] Resend: email delivery rate
- [ ] Check customer emails daily for first week

## Troubleshooting

### Build fails
```
npm run build
# Check for TypeScript errors, fix, redeploy
```

### Webhook not firing
- Verify URL in Stripe dashboard
- Check Vercel logs: `/api/webhooks/stripe`
- Stripe dashboard → Webhooks → click endpoint → "Resend"

### Emails not sending
- Check Resend dashboard → Activity
- Verify RESEND_API_KEY is correct
- Check EMAIL_FROM format

### Dashboard shows "No removals yet"
- Verify intake submission reached Supabase (check customers table)
- Verify token in URL matches database record
- Check browser console for errors

---

**Estimated time: 1 hour**
**Cost: ~$25/month** (Supabase + Stripe + Resend + Vercel)
