# Gemai - AI-Powered Instagram Automation Platform

**Website:** [gemai.in](https://gemai.in) | [gemai.omyratech.com](https://gemai.omyratech.com)

Gemai is a sophisticated Instagram automation platform that helps businesses and creators transform Instagram DMs and comments into revenue using intelligent AI automation. Scale your Instagram presence, engage customers instantly, and drive sales 24/7—no manual work required.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes (App Router), Prisma ORM
- **State Management**: Redux Toolkit, React Query (TanStack Query)
- **Authentication**: Clerk
- **Database**: Postgres (via Prisma)
- **APIs**: Instagram Graph API, OpenAI API
- **Styling**: TailwindCSS, CSS Modules
- **UI Components**: RadixUI, shadcn/ui

## Key Features

- **🤖 Instagram DM Automation**

  - Lightning-fast automated responses to direct messages
  - AI-powered keyword and intent-based triggers
  - Context-aware intelligent responses
  - Custom message templates with personalization
  - 24/7 availability—never miss a potential customer

- **💬 Comment Automation**

  - Automated responses to post comments
  - Post-specific automation rules
  - Smart engagement tracking
  - Bulk comment management

- **🧠 Advanced AI Integration**

  - GPT-powered response generation
  - Context-aware conversational AI
  - Natural language understanding
  - Brand voice customization
  - Lead qualification automation

- **📊 Real-Time Analytics Dashboard**
  - Comprehensive engagement metrics
  - Conversion tracking and ROI measurement
  - Automation performance insights
  - Response rate statistics
  - Customer interaction history

- **🔧 No-Code Automation Builder**

  - Visual workflow editor
  - Drag-and-drop automation creation
  - Conditional logic and branching
  - Multi-step automation sequences

- **🔒 Enterprise-Grade Security**
  - Bank-level encryption
  - GDPR compliance
  - Official Meta/Instagram API integration
  - Secure data handling

## Project Structure

```
├── src/
│   ├── actions/                 # Server actions for data mutations
│   │   ├── automations/        # Automation-related actions
│   │   ├── integrations/       # Third-party integration actions
│   │   ├── user/              # User-related actions
│   │   └── webhook/           # Webhook handlers for Instagram
│   │
│   ├── app/                    # Next.js 13 app directory
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (protected)/       # Protected dashboard routes
│   │   ├── (website)/         # Public website routes
│   │   └── api/               # API routes
│   │
│   ├── components/             # React components
│   │   ├── global/            # Shared components
│   │   └── ui/                # UI components (shadcn/ui)
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and configs
│   ├── providers/             # React context providers
│   └── types/                 # TypeScript type definitions
│
├── prisma/                     # Prisma schema and migrations
├── redux/                      # Redux store and slices
└── public/                    # Static assets
```

## Core Workflows

### 1. Authentication Flow

- User signs up/logs in using **Clerk** authentication
- Protected routes are handled by the `(protected)` directory
- Authentication state managed by Clerk Provider
- Session validation via middleware

### 2. Automation Creation Flow

1. User creates new automation from dashboard
2. Configures trigger type:
   - **DM** (Direct Message trigger)
   - **COMMENT** (Post comment trigger)
3. Sets up keywords to match incoming messages/comments
4. Configures listener/response type:
   - **MESSAGE** - Send predefined template message
   - **SMARTAI** - AI-powered dynamic responses (PRO plan)
5. Activates automation
6. System tracks response counts and enforces cooldowns

### 3. Instagram Integration Flow

1. User clicks "Connect Instagram" in dashboard
2. **OAuth Flow:**
   - Redirects to Facebook OAuth (Instagram API requires Facebook login)
   - User logs in with Facebook account
   - Selects Instagram Business/Creator account to connect
   - Grants required permissions
3. Platform receives authorization code
4. **Token Exchange:**
   - Exchange code for short-lived access token
   - Exchange short-lived token for long-lived token (60 days)
   - Store token with Instagram user ID in database
5. **Webhook Verification:**
   - Meta sends GET request to verify webhook endpoint
   - Platform responds with challenge token
6. **Webhook Active:**
   - Incoming DMs/comments trigger POST requests to webhook
   - Signature verification ensures authenticity
   - Automation rules are matched and responses sent

### 4. Instagram Webhook Processing Flow

When a user sends a DM or comments:

1. **Instagram sends webhook** → `POST /api/webhook/instagram`
2. **Security checks:**
   - Rate limiting verification
   - HMAC signature verification using `INSTAGRAM_APP_SECRET`
3. **Payload parsing:**
   - Detect type: DM (`messaging`) or Comment (`changes`)
   - Extract message text and sender ID
4. **Keyword matching:**
   - Search for matching keywords in automation rules
   - If match found, proceed to response
5. **Response generation:**
   - **MESSAGE mode:** Send predefined template
   - **SMARTAI mode:** Generate AI response using OpenAI
6. **Cooldown enforcement:**
   - DM cooldown (per user per automation)
   - Comment cooldown (per post per user)
   - SmartAI cooldown (per conversation)
   - Global automation cooldown
7. **Send response:**
   - DMs: `POST graph.instagram.com/v21.0/{user-id}/messages`
   - Comments: Private reply via `POST graph.instagram.com/{user-id}/messages`
8. **Track metrics:**
   - Increment DM/comment counters
   - Store conversation history (for SmartAI)
   - Validate subscription limits

### 5. AI Response Flow (SmartAI - PRO Plan Only)

1. **Incoming message** triggers automation
2. **Keyword matched** → SmartAI listener detected
3. **Retrieve conversation history** from database
4. **Rate limit check** for OpenAI API
5. **Generate AI response:**
   - Send prompt + conversation history to OpenAI GPT-4o
   - Include custom prompt from automation settings
   - Limit response to 2 sentences (Instagram constraint)
6. **Store conversation:**
   - Save user message to chat history
   - Save AI response to chat history
7. **Send response** via Instagram Graph API
8. **Track usage** and update counters

### 6. Subscription & Rate Limiting

**Subscription Tiers:**
- **FREE Plan:**
  - Limited DMs/comments per automation
  - Template messages only
  - Basic analytics
  
- **PRO Plan:**
  - Unlimited DMs/comments
  - SmartAI responses with GPT-4o
  - Advanced analytics
  - Conversation history

**Rate Limiting (Redis-based):**
- Webhook endpoint: Prevents spam/abuse
- Instagram API calls: Prevents hitting Meta's limits
- OpenAI API calls: Per-automation rate limiting
- Cooldown periods prevent duplicate responses

## API Structure

### Internal APIs (Next.js API Routes)

#### Webhook Endpoints
- **`/api/webhook/instagram`** (GET, POST)
  - Handles Instagram webhook verification and events
  - Processes incoming DMs and comments
  - Signature verification with HMAC-SHA256
  - Rate limiting and cooldown enforcement
  - Triggers automation responses

- **`/api/data-deletion`** (POST, GET)
  - Meta-required endpoint for GDPR compliance
  - Handles user data deletion requests
  - Returns confirmation code and status URL

#### Payment Endpoints
- **`/api/webhook/stripe`** (POST)
  - Handles Stripe webhook events
  - Processes subscription updates
  - Manages payment confirmations

- **`/api/payment`** (GET, POST)
  - Creates Stripe checkout sessions
  - Manages subscription upgrades/downgrades

### Server Actions (Next.js App Directory)

#### Automation Actions (`/actions/automations`)
- `createAutomation()` - Create new automation
- `updateAutomation()` - Update automation settings
- `deleteAutomation()` - Remove automation
- `findAutomation()` - Query automation details
- `getKeywordAutomation()` - Get automation by keyword match

#### Integration Actions (`/actions/integrations`)
- `onOAuthInstagram()` - Initiate Instagram OAuth flow
- `onIntegrate()` - Complete OAuth and store tokens
- `refreshToken()` - Refresh expired Instagram tokens

#### User Actions (`/actions/user`)
- `onCurrentUser()` - Get current authenticated user
- `onUserInfo()` - Fetch user profile and integrations

#### Webhook Actions (`/actions/webhook`)
- `matchKeyword()` - Find matching automation keywords
- `getKeywordPost()` - Get post associated with automation
- `trackResponses()` - Increment DM/comment counters
- `createChatHistory()` - Store conversation messages
- `getChatHistory()` - Retrieve conversation history

### External APIs

#### Instagram Graph API (graph.instagram.com)
- **Send DM:**
  - `POST /v21.0/{user-id}/messages`
  - Sends direct messages to Instagram users
  
- **Reply to Comment:**
  - `POST /{user-id}/messages`
  - Sends private replies to post comments
  
- **Refresh Token:**
  - `GET /refresh_access_token?grant_type=ig_refresh_token&access_token={token}`
  - Refreshes long-lived access tokens
  
- **Get User Info:**
  - `GET /me?fields=user_id&access_token={token}`
  - Retrieves Instagram user ID
  
- **Get Media:**
  - `GET /me/media?fields=id,caption,media_url,media_type,timestamp&access_token={token}`
  - Fetches user's Instagram posts

#### Facebook Graph API (graph.facebook.com)
- **OAuth Token Exchange:**
  - `GET /v21.0/oauth/access_token`
  - Exchanges authorization code for access token
  
- **Long-Lived Token:**
  - `GET /v21.0/oauth/access_token?grant_type=fb_exchange_token`
  - Exchanges short-lived token for long-lived token (60 days)

#### OpenAI API
- **Chat Completions:**
  - `POST /v1/chat/completions`
  - Generates AI responses using GPT-4o model
  - Context-aware with conversation history
  - Custom prompts per automation

## State Management

- **Redux**: Manages global UI state and automation configurations
- **React Query**: Handles server state, data fetching, and mutations
- **Local State**: Component-level state using React hooks

## Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/omyratechnologies/dm-automation.git
cd dm-automation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# ==================== DATABASE ====================
# Using Prisma Accelerate for better performance and connection pooling
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_PRISMA_ACCELERATE_KEY"
DIRECT_DATABASE_URL="postgres://YOUR_DIRECT_DATABASE_URL"

# ==================== INSTAGRAM API ====================
# Server-side variables (used in API routes and server actions)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_generate_random_string
INSTAGRAM_BASE_URL=https://graph.instagram.com
INSTAGRAM_TOKEN_URL=https://graph.facebook.com/v21.0/oauth/access_token
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret

# Client-side variables (accessible in browser, prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_INSTAGRAM_APP_ID=your_instagram_app_id
NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL=https://www.facebook.com/v21.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=YOUR_DOMAIN/callback/instagram&scope=instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement,business_management&response_type=code&auth_type=rerequest

# Server-side OAuth URL
INSTAGRAM_EMBEDDED_OAUTH_URL=https://www.facebook.com/v21.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=YOUR_DOMAIN/callback/instagram&scope=instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement,business_management&response_type=code&auth_type=rerequest

# ==================== OPENAI ====================
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY

# ==================== UPSTASH REDIS ====================
# For rate limiting and caching
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_TOKEN"

# ==================== CLERK AUTHENTICATION ====================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_KEY
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET

# ==================== STRIPE PAYMENT ====================
STRIPE_CLIENT_SECRET=sk_test_YOUR_STRIPE_SECRET
NEXT_PUBLIC_STRIPE_PUBLISH_KEY=pk_test_YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_SUBSCRIPTION_PRICE_ID=price_YOUR_PRICE_ID

# ==================== HOST URL ====================
# Development
NEXT_PUBLIC_HOST_URL=http://localhost:3000

# Production (update when deploying)
# NEXT_PUBLIC_HOST_URL=https://gemai.omyratech.com
```

### 4. Configure Instagram/Meta Developer App

#### A. Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create a new app or use existing app
3. Add these products:
   - ✅ **Instagram** (Instagram API for messaging)
   - ✅ **Facebook Login**
   - ✅ **Webhooks**

#### B. Configure Facebook Login
1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs:**
   ```
   http://localhost:3000/callback/instagram
   https://yourdomain.com/callback/instagram
   ```
3. Enable:
   - ✅ Client OAuth Login
   - ✅ Web OAuth Login
   - ✅ Use Strict Mode for Redirect URIs

#### C. Configure Webhooks
1. Go to **Webhooks** → **Instagram**
2. Click **Edit Subscription**
3. Enter:
   - **Callback URL:** `https://yourdomain.com/api/webhook/instagram`
   - **Verify Token:** (same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` in `.env.local`)
4. Subscribe to:
   - ✅ `messages`
   - ✅ `comments`

#### D. Request Permissions
Request these permissions for Advanced Access:
- `instagram_business_basic`
- `instagram_manage_comments`
- `instagram_business_manage_messages`
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

#### E. Data Deletion Callback (Required by Meta)
1. Go to **Settings** → **Basic**
2. Add **Data Deletion Request URL:**
   ```
   https://yourdomain.com/api/data-deletion
   ```

### 5. Run database migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Start the development server

```bash
npm run dev
```

Access the app at `http://localhost:3000`

### 7. Testing with ngrok (for webhook development)

For local webhook testing:

```bash
# Install ngrok
brew install ngrok

# Start ngrok
ngrok http 3000

# Use the ngrok URL in Meta Dashboard webhook settings
# Example: https://abc123.ngrok.io/api/webhook/instagram
```

---

## 📋 Meta Developer Dashboard Configuration

### Required for Instagram Webhooks

**Callback URL:**
```
https://yourdomain.com/api/webhook/instagram
```
(For local testing: `https://your-ngrok-url.ngrok.io/api/webhook/instagram`)

**Verify Token:**
Use the value from your `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` environment variable

**Subscribe to Fields:**
- ✅ `messages` - For DM automation
- ✅ `comments` - For comment automation

### Instagram Account Requirements

**Users must have:**
- Instagram Business Account OR Instagram Creator Account
- Connected to a Facebook Page
- Cannot use regular personal Instagram accounts

**For Testing:**
1. Add testers in **Roles** section of Meta Dashboard
2. Testers must have Instagram Business/Creator accounts
3. Testers must accept invitation in their Instagram app

---

## � Troubleshooting

### Instagram OAuth Issues

**Error: "Invalid platform app"**
- Ensure Instagram product is added in Meta Dashboard
- Verify you're using the correct App ID
- Check that Facebook Login product is configured

**Error: "Redirect URI mismatch"**
- Add redirect URI in Facebook Login settings
- Ensure exact match including protocol (http/https)
- Format: `https://yourdomain.com/callback/instagram`

**Error: "Permissions not granted"**
- Request permissions in App Review
- Add account as tester for development
- Accept tester invitation in Instagram app

### Webhook Issues

**Webhook not receiving events:**
- Verify webhook is subscribed to correct fields (`messages`, `comments`)
- Check that verify token matches environment variable
- Ensure app is not in maintenance mode
- Test with ngrok for local development

**Error: "Invalid signature"**
- Verify `INSTAGRAM_APP_SECRET` is correct
- Check that signature verification logic is enabled
- Ensure raw body is used for signature validation

### Token Issues

**Token expired:**
- Implement token refresh logic
- Long-lived tokens expire after 60 days
- Use `/refresh_access_token` endpoint to renew

**Error: "Invalid token"**
- Re-authenticate user through OAuth flow
- Check token is stored correctly in database
- Verify token hasn't been revoked

### Database Issues

**Migration errors:**
- Use `DIRECT_DATABASE_URL` for migrations
- Use `DATABASE_URL` (Prisma Accelerate) for queries
- Run: `npx prisma migrate reset` (caution: deletes data)

### Rate Limiting

**429 errors:**
- Redis rate limiters are enforced
- Check Redis connection (`UPSTASH_REDIS_REST_URL`)
- Review rate limit settings in `/lib/redis.ts`

---

## 📚 Additional Resources

- [Meta for Developers](https://developers.facebook.com)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Webhooks Setup Guide](https://developers.facebook.com/docs/graph-api/webhooks)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)

---

## Production Deployment

Gemai is optimized for production deployment on Vercel:

1. Connect your repository to Vercel
2. Configure all environment variables
3. Deploy!

**Production URLs:**
- Primary: [https://gemai.in](https://gemai.in)
- Secondary: [https://gemai.omyratech.com](https://gemai.omyratech.com)

## Design System

The project uses a consistent design system built on:

- TailwindCSS for styling
- shadcn/ui components
- Custom theme configuration
- Responsive design principles

## About Gemai

Gemai is developed and maintained by **Omyra Technologies**, a leading software development company specializing in AI-powered business automation solutions.

**Contact Us:**
- Website: [gemai.in](https://gemai.in)
- Email: support@gemai.in
- Company: [Omyra Technologies](https://omyratech.com)

## License

© 2025 Omyra Technologies. All rights reserved.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
