# Payment System Testing Guide

This guide will help you test the Stripe Connect integration in the KOL marketplace.

## Prerequisites

### 1. Stripe Account Setup
1. Create a [Stripe account](https://stripe.com) if you don't have one
2. Get your **test** API keys from the Stripe Dashboard:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe test keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. Database Setup
Run the database migrations to set up the payment system:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually in your Supabase dashboard
# Copy content from supabase/migrations/011_order_files.sql
```

## Testing the Payment System

### Phase 1: KOL Stripe Connect Setup

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Navigate as a KOL:**
   - Go to: http://localhost:3000
   - Login as a KOL user
   - Switch role to "KOL" if needed

3. **Access Payment Settings:**
   - Go to: http://localhost:3000/settings/payments
   - You should see "Connect Your Stripe Account" page

4. **Connect Stripe Account:**
   - Click "Connect with Stripe"
   - This should:
     - Create a Stripe Express account
     - Redirect you to Stripe's onboarding flow
     - Use test data (see below)

### Phase 2: Stripe Onboarding (Test Mode)

When redirected to Stripe, use these **test values**:

**Business Information:**
- Country: United States
- Business Type: Individual
- First/Last Name: Any test names
- Phone: Any US phone number format

**Address:**
- Use any valid US address format:
  - Street: 123 Test Street
  - City: San Francisco
  - State: California
  - ZIP: 94105

**Tax ID (SSN):**
- Use test SSN: `000-00-0000` or `123-45-6789`

**Bank Account:**
- Routing Number: `110000000` (test routing number)
- Account Number: Any 10-17 digit number

**Identity Verification:**
- Upload any image file for ID verification
- In test mode, all uploads are accepted

### Phase 3: Verify Connection

1. **Return to your app:**
   - After completing Stripe onboarding
   - You should be redirected back to `/settings/payments?success=true`

2. **Check connection status:**
   - Page should show "Stripe Connected!" with green checkmark
   - Account details should display:
     - Account ID (starts with `acct_`)
     - Charges Enabled: ✓ Yes
     - Details Submitted: ✓ Complete

3. **Test account management:**
   - Click "Manage Account" button
   - Should redirect back to Stripe for account updates

### Phase 4: File Upload Testing

1. **Create a test order:**
   - Navigate to a KOL's gig page
   - Place an order as a sponsor
   - Go to the order page: `/orders/[order-id]`

2. **Test file upload (as KOL):**
   - Switch to KOL role
   - Go to the order page
   - Upload an MP4 file (max 5MB)
   - Add a message
   - Click "Submit Work"

3. **Verify file handling:**
   - File should upload to Supabase storage
   - Order status should change to "submitted"
   - Timeline should show uploaded file with download link

## API Testing

You can also test the API endpoints directly:

### 1. Create Stripe Account
```bash
curl -X POST http://localhost:3000/api/stripe/connect/create \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 2. Get Account Status
```bash
curl http://localhost:3000/api/stripe/connect/status \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 3. Create Onboarding Link
```bash
curl -X POST http://localhost:3000/api/stripe/connect/onboard \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Troubleshooting

### Common Issues:

1. **"Unauthorized" errors:**
   - Make sure you're logged in
   - Check Supabase session is valid

2. **"Only KOLs can connect" error:**
   - Verify user role is set to "kol" in database
   - Check RoleContext is working

3. **Stripe keys not working:**
   - Verify keys are test keys (start with `pk_test_` and `sk_test_`)
   - Check environment variables are loaded

4. **Database errors:**
   - Run migrations: `supabase db push`
   - Check Supabase connection

5. **File upload fails:**
   - Check Supabase storage bucket exists
   - Verify RLS policies allow file upload
   - Ensure file is MP4 and under 5MB

### Debug API Responses:

Check browser console and network tab for detailed error messages. API responses include helpful error information.

## Expected Test Flow

1. ✅ KOL visits payment settings
2. ✅ Clicks "Connect with Stripe"
3. ✅ Redirected to Stripe onboarding
4. ✅ Completes onboarding with test data
5. ✅ Redirected back with success message
6. ✅ Page shows "Stripe Connected!"
7. ✅ Can manage account through Stripe
8. ✅ File uploads work in orders
9. ✅ Downloads work for uploaded files

## Test Data Resources

- [Stripe Test Data](https://stripe.com/docs/testing)
- [Test Bank Account Numbers](https://stripe.com/docs/connect/testing)
- [Test Identity Documents](https://stripe.com/docs/connect/testing#test-personal-id-numbers)

The payment system is now ready for comprehensive testing! 🚀