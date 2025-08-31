# Stripe Connect Setup Guide

## Problem
Getting error: "You can only create new accounts if you've signed up for Connect"

## Solution: Enable Stripe Connect

### Step 1: Enable Connect in Stripe Dashboard

1. **Go to your Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/test/connect/overview
   - Make sure you're in **TEST MODE** (toggle in top-left)

2. **Enable Connect**
   - Click "Get started with Connect"
   - Or go directly to: https://dashboard.stripe.com/test/connect/accounts/overview

3. **Accept Connect Terms**
   - Read and accept the Stripe Connect Service Agreement
   - This enables Connect functionality for your account

### Step 2: Configure Connect Settings

1. **Go to Connect Settings**
   - Navigate to: https://dashboard.stripe.com/test/connect/settings

2. **Set up your platform**
   - Platform name: "KOL Marketplace" (or your preferred name)
   - Platform website: http://localhost:3000 (for testing)
   - Support email: your email address

3. **Configure OAuth settings** (optional for Express accounts)
   - For Express accounts, OAuth isn't required
   - Our implementation uses direct account creation

### Step 3: Verify API Access

After enabling Connect, your API keys should have Connect permissions:

1. **Check API Key Permissions**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Your secret key should now have Connect capabilities

2. **Test API Access**
   ```bash
   curl https://api.stripe.com/v1/accounts \
     -H "Authorization: Bearer sk_test_your_key_here"
   ```

## Alternative: Use Existing Account Pattern

If you prefer not to create new accounts, here's a simpler approach:

### Option A: Single Account with Transfers

Instead of creating separate accounts for each KOL, use transfers:

1. All payments go to your main Stripe account
2. Transfer funds to KOLs' bank accounts directly
3. Handle tax reporting manually

### Option B: Mock Implementation for Development

For development/testing only, we can create a mock version:

```typescript
// Mock Stripe Connect for development
const createMockStripeAccount = async () => {
  return {
    id: 'acct_mock_' + Math.random().toString(36),
    charges_enabled: true,
    details_submitted: true,
    type: 'express'
  }
}
```

## Recommended Approach

I recommend **enabling Stripe Connect** because:

1. **Proper compliance** - KOLs handle their own tax reporting
2. **Better user experience** - Direct payouts to KOL bank accounts
3. **Reduced liability** - Stripe handles KYC and compliance
4. **Industry standard** - How all major marketplaces work

## Quick Fix for Testing

If you want to test immediately without setting up Connect:

1. **Enable mock mode** in the API routes
2. **Skip account creation** and use fake account IDs
3. **Focus on UI/UX testing** while setting up Connect

Would you like me to:
1. Help you enable Stripe Connect (recommended)
2. Create a mock version for immediate testing
3. Implement the transfer-based approach

Let me know your preference!