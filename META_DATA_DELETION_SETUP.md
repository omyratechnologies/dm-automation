# Meta Data Deletion Setup Guide

This guide explains how to configure the data deletion callback required by Meta for apps using Facebook/Instagram Login.

## 🚀 Quick Setup

### 1. Run Database Migration

First, update your database schema with the new `DataDeletionRequest` model:

```bash
npx prisma migrate dev --name add_data_deletion_request
npx prisma generate
```

### 2. Configure Meta App Dashboard

1. Go to [Meta Developer Dashboard](https://developers.facebook.com)
2. Select your app
3. Navigate to **Settings** → **Basic**
4. Find **"Data Deletion Request Callback URL"**
5. Enter your production URL:
   ```
   https://your-api-domain.com/v1/webhooks/meta/data-deletion
   ```
6. Save changes

### 3. Test the Endpoint (Local Development)

For local testing with ngrok:

```bash
# Start ngrok
ngrok http 4000

# Use the ngrok URL in Meta dashboard (temporary for testing)
https://your-ngrok-url.ngrok.io/v1/webhooks/meta/data-deletion
```

## 📋 What Was Created

### 1. API Endpoint: `/v1/webhooks/meta/data-deletion`
- **File:** `apps/api/src/gdpr/gdpr.controller.ts`
- **Purpose:** Receives data deletion requests from Meta
- **Methods:** POST (main), GET (testing)

### 2. Status Page: `/data-deletion-status/[code]`
- **File:** `apps/web/src/app/data-deletion-status/[code]/page.tsx`
- **Purpose:** Shows deletion request status to users
- **URL Example:** `https://yourdomain.com/data-deletion-status/abc123`

### 3. Instructions Page: `/account-deletion`
- **File:** `apps/web/src/app/account-deletion/page.tsx`
- **Purpose:** User-facing instructions for account deletion
- **URL:** `https://yourdomain.com/account-deletion`

### 4. Database Model: `DataDeletionRequest`
- **File:** `packages/db/prisma/schema.prisma`
- **Purpose:** Track deletion requests for compliance

## 🔐 How It Works

1. **User removes app from Facebook/Instagram:**
   - User goes to Facebook Settings → Apps and Websites
   - Removes your app

2. **Meta sends deletion request:**
   - POST request to your `/v1/webhooks/meta/data-deletion` endpoint
   - Contains signed_request with user's Instagram/Facebook ID

3. **Your app processes deletion:**
   - Verifies the signed request signature
   - Finds user by Instagram ID
   - Deletes the connected Instagram account and encrypted token
   - Cascades deletion through contacts, conversations, messages, flow runs,
     leads and broadcasts associated with that Instagram account
   - Deletes matching stored Instagram webhook payloads
   - Creates deletion record for compliance

4. **Returns confirmation:**
   - Generates unique confirmation code
   - Returns status URL to Meta
   - User can check status at: `/data-deletion-status/{code}`

## 🧪 Testing

### Test the endpoint locally:

```bash
# Start your dev server
npm run dev

# Test POST request (simulate Meta request)
curl -X POST http://localhost:4000/v1/webhooks/meta/data-deletion \
  -H "Content-Type: application/json" \
  -d '{"signed_request": "test_signature.test_payload"}'
```

## 📝 Data Deleted

When a deletion request is processed, the following data is removed:

- ✅ Connected Instagram account and encrypted access token
- ✅ Instagram/Facebook integration data
- ✅ Access tokens
- ✅ Flow runs associated with Instagram contacts
- ✅ Direct messages (DMs)
- ✅ Leads and broadcasts associated with the connection
- ✅ Stored Instagram webhook payloads

## ⚠️ Important Notes

1. **HTTPS Required:** Meta requires HTTPS for production callbacks
2. **Signature Verification:** The endpoint verifies Meta's signed request
3. **Compliance:** Deletion records are kept for audit purposes
4. **Timeline:** Complete deletion within 30 days (as per policy)
5. **Backup Data:** May persist in backups up to 90 days

## 🔗 URLs to Provide to Meta

Choose ONE of these options:

### Option 1: Automated Callback (Recommended)
```
https://your-api-domain.com/v1/webhooks/meta/data-deletion
```
**Pros:** Automatic processing, no user intervention needed

### Option 2: Instructions Page
```
https://yourdomain.com/account-deletion
```
**Pros:** User controls deletion, manual process

## 📚 Additional Resources

- [Meta Data Deletion Documentation](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- [GDPR Compliance](https://gdpr.eu/right-to-be-forgotten/)
- Your Privacy Policy: `/privacy-policy`
- Your GDPR Page: `/gdpr`

## 🐛 Troubleshooting

### Error: "Invalid signature"
- Check that `INSTAGRAM_APP_SECRET` is set correctly in the API environment
- Verify the secret matches your Meta app dashboard

### Error: "Database deletion error"
- Ensure Prisma migrations are run: `npx prisma migrate dev`
- Check database connection in `.env.local`

### User not found
- The endpoint will still return success to Meta
- This is normal if the user never connected Instagram

### Testing in development
- Use ngrok to expose localhost to Meta
- Remember to update the callback URL in Meta dashboard

## 📞 Support

If you need help:
- Email: support@yourdomain.com
- Documentation: `/account-deletion`

## ✅ Checklist

Before going live, ensure:

- [ ] Database migration completed
- [ ] `INSTAGRAM_APP_SECRET` configured in `.env.local`
- [ ] Endpoint tested locally
- [ ] URL added to Meta dashboard
- [ ] HTTPS certificate installed (production)
- [ ] Privacy policy updated
- [ ] Support email configured
- [ ] Tested full deletion flow
