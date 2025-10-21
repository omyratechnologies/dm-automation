# DM Automations (dm.ai)

A sophisticated Instagram automation platform that helps businesses and creators automate their Instagram DM responses and comment interactions using AI.

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

- **Instagram DM Automation**

  - Automated responses to direct messages
  - Keyword-based triggers
  - Smart AI-powered responses
  - Custom message templates

- **Comment Automation**

  - Automated responses to post comments
  - Post-specific automation rules
  - Engagement tracking

- **Smart AI Integration**

  - AI-powered response generation
  - Context-aware messaging
  - Natural language processing

- **Analytics Dashboard**
  - Engagement metrics
  - Automation performance tracking
  - Response statistics

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
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```env
DATABASE_URL=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
OPENAI_API_KEY=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## Production Deployment

The application is optimized for production deployment on Vercel:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy!

## Design System

The project uses a consistent design system built on:

- TailwindCSS for styling
- shadcn/ui components
- Custom theme configuration
- Responsive design principles

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request
