// Automation Types
export interface Automation {
  id: string;
  name: string;
  keywords: Keyword[];
  createdAt: Date;
  listener: Listener | null;
  posts?: Post[];
  active?: boolean;
}

export interface Keyword {
  id: string;
  word: string;
  automationId: string | null;
}

export interface Listener {
  id: string;
  listener: 'SMARTAI' | 'MESSAGE';
  automationId: string;
  prompt: string;
  commentReply: string | null;
  dmCount: number;
  commentCount: number;
}

export interface Post {
  id: string;
  postid: string;
  caption?: string | null;
  media: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM';
  automationId: string | null;
}

// User Types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstname: string;
  lastname: string;
  createdAt: Date;
  subscription: Subscription | null;
  integrations: Integration[];
}

export interface Subscription {
  id: string;
  plan: 'FREE' | 'PRO';
  customerId: string | null;
}

export interface Integration {
  id: string;
  name: 'INSTAGRAM' | 'CRM';
  token: string;
  expiresAt: Date | null;
  instagramId: string | null;
}

// Analytics Types
export interface AutomationAnalytics {
  id: string;
  name: string;
  active: boolean;
  comments: number;
  dms: number;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface AutomationFormData {
  name?: string;
  prompt?: string;
  reply?: string;
  keywords?: string[];
  triggers?: ('COMMENT' | 'DM')[];
  posts?: string[];
}

// Component Props Types
export interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: 'INSTAGRAM' | 'CRM';
}

export interface MetricsCardProps {
  title?: string;
  value?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
}

export interface SkeletonProps {
  className?: string;
  count?: number;
}
