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

- User signs up/logs in using Clerk authentication
- Protected routes are handled by the (protected) directory
- Authentication state managed by Clerk Provider

### 2. Automation Creation Flow

1. User creates new automation from dashboard
2. Configures trigger type (DM or Comment)
3. Sets up keywords or conditions
4. Configures response type (Template or AI)
5. Activates automation

### 3. Instagram Integration Flow

1. User connects Instagram account via OAuth
2. Platform receives webhook verification
3. Webhook endpoint processes incoming events
4. Automated responses are sent via Instagram Graph API

### 4. AI Response Flow

1. Incoming message is processed
2. Keywords are matched against automation rules
3. AI context is generated from conversation history
4. OpenAI generates appropriate response
5. Response is sent back to user via Instagram API

## API Structure

### Internal APIs

- `/api/webhook/instagram`: Handles Instagram webhook events
- `/api/automations`: Manages automation CRUD operations
- `/api/user`: Handles user-related operations

### External APIs

- Instagram Graph API: For messaging and comment interactions
- OpenAI API: For AI-powered response generation

## State Management

- **Redux**: Manages global UI state and automation configurations
- **React Query**: Handles server state, data fetching, and mutations
- **Local State**: Component-level state using React hooks

## Development Setup

1. Clone the repository

```bash
git clone https://github.com/omyratechnologies/gemai.git
cd gemai
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create `.env.local`):

```env
# Database
DATABASE_URL=

# Instagram/Meta API
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=

# OpenAI
OPENAI_API_KEY=

# Authentication (Clerk)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Payment (Stripe)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App URLs
NEXT_PUBLIC_APP_URL=https://gemai.in
```

4. Run database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

Access the app at `http://localhost:3000`

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
