export type ApiResult<T> =
  | { readonly status: 200; readonly data: T }
  | { readonly status: 201; readonly data: T }
  | { readonly status: 400; readonly data?: string }
  | { readonly status: 401; readonly data?: string }
  | { readonly status: 403; readonly data?: string }
  | { readonly status: 404; readonly data?: string }
  | { readonly status: 500; readonly data?: string }
  | { readonly status: 503; readonly data?: string };

export function success<T>(data: T): ApiResult<T> {
  return { status: 200 as const, data };
}

export function created<T>(data: T): ApiResult<T> {
  return { status: 201 as const, data };
}

export function notFound(message?: string): ApiResult<never> {
  return { status: 404 as const, data: message };
}

export function serverError(message?: string): ApiResult<never> {
  return { status: 500 as const, data: message };
}

export type AutomationKeyword = {
  id: string;
  word: string;
  automationId: string | null;
};

export type AutomationTrigger = {
  id: string;
  type: string;
  automationId: string | null;
};

export type AutomationPost = {
  id: string;
  postid: string;
  caption: string | null;
  media: string;
  mediaType: string;
  requireFollow: boolean;
  automationId: string | null;
};

export type AutomationListener = {
  id: string;
  automationId: string;
  listener: string;
  prompt: string;
  commentReply: string | null;
  dmCount: number;
  commentCount: number;
};

export type AutomationListItem = {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  userId: string | null;
  keywords: AutomationKeyword[];
  listener: AutomationListener | null;
};

export type UserProfile = {
  id: string;
  clerkId: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  createdAt: Date;
  subscription: {
    id: string;
    userId: string | null;
    createdAt: Date;
    plan: "FREE" | "PRO";
    updatedAt: Date;
    customerId: string | null;
  } | null;
  integrations: Array<{
    id: string;
    name: string;
    expiresAt: Date | null;
    instagramId: string | null;
    createdAt: Date;
    username?: string | null;
  }>;
};

export type InstagramMediaResponse = {
  data: Array<{
    id: string;
    media_type: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
    media_url: string;
    timestamp: string;
    caption?: string;
  }>;
};

export type AutomationData = AutomationListItem & {
  trigger: AutomationTrigger[];
  posts: AutomationPost[];
  User: {
    clerkId: string;
    integrations: Array<{
      id: string;
      name: string;
      token?: string;
      expiresAt: Date | null;
      instagramId: string | null;
      createdAt: Date;
      userId: string | null;
    }>;
    subscription: {
      id: string;
      customerId: string | null;
    plan: "FREE" | "PRO";
      createdAt: Date;
    } | null;
  } | null;
};
