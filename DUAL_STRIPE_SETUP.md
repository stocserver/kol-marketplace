# Dual Stripe Connection Setup

## Overview

KOLs now have **two options** to connect their Stripe accounts:

### Option 1: "I already have a Stripe account" 
- **OAuth connection** to existing Stripe account
- KOL logs into their existing Stripe account
- Authorizes your platform to access their account

### Option 2: "Create a new Stripe account"
- **Express account creation** (previous flow)
- Creates a new Stripe Express account
- Guided onboarding for new users

## Required Setup

### 1. Get Stripe Client ID (for OAuth)

1. **Go to your Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/test/connect/overview
   
2. **Get Client ID**
   - Look for "Client ID" in the Connect settings
   - It starts with `ca_` (like `ca_abcdef123456`)
   - Copy this value

3. **Add to Environment Variables**
   ```bash
   STRIPE_CLIENT_ID=ca_your_actual_client_id_here
   ```

### 2. Configure OAuth Redirect URI

In your Stripe Dashboard:
1. Go to Connect Settings
2. Add redirect URI: `http://localhost:3000/api/stripe/connect/oauth/callback`
3. For production, add your production URL

### 3. Update Your .env File

```bash
# Existing variables
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# New variable for OAuth
STRIPE_CLIENT_ID=ca_your_client_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How It Works

### Option 1: OAuth Flow (Existing Account)
1. KOL clicks "Connect Existing Account"
2. Redirected to Stripe OAuth login
3. KOL logs into their Stripe account
4. Authorizes your platform access
5. Returns with connected account

### Option 2: Express Flow (New Account)  
1. KOL clicks "Create New Account"
2. System creates Stripe Express account
3. Redirected to Stripe onboarding
4. KOL fills out business/banking info
5. Returns with new account set up

## Testing Both Options

### Test OAuth (Existing Account)
You'll need a real Stripe account to test this:
1. Create a Stripe account at stripe.com
2. Click "Connect Existing Account"
3. Log in with your Stripe credentials
4. Authorize the connection

### Test Express (New Account)
Use test data:
1. Click "Create New Account"
2. Use test data from previous guide
3. Complete onboarding flow

## Benefits of Dual Approach

✅ **Flexibility**: Accommodates users with/without Stripe accounts
✅ **Better UX**: Familiar login for existing users, guided setup for new ones
✅ **Choice**: KOLs can decide what works best for them
✅ **Compliance**: Both methods handle tax/compliance properly

## UI Preview

The payment settings page now shows:
- Blue option box: "I already have a Stripe account"
- Green option box: "Create a new Stripe account"  
- Clear descriptions of each approach
- Different button styling and icons

## Notes

- **OAuth requires STRIPE_CLIENT_ID** - get this from your Connect dashboard
- **Express flow works immediately** with existing setup
- **Both approaches store account data** the same way
- **Same connection status** shown regardless of method used

Ready to test! 🚀