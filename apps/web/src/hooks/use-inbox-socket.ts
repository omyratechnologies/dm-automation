"use client";

import { API_URL } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

type InboxSocketHandlers = {
  onMessageCreated?: (payload: any) => void;
  onConversationUpdated?: (payload: any) => void;
};

/**
 * Connects to the socket.io /inbox namespace with the Clerk JWT, joins the
 * workspace room and forwards realtime events. Handlers are kept in a ref so
 * re-renders never tear the connection down.
 */
export const useInboxSocket = (
  workspaceId: string | null,
  handlers: InboxSocketHandlers
) => {
  const { getToken } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!workspaceId) return;

    const socket = io(`${API_URL}/inbox`, {
      auth: (cb) => {
        getToken()
          .then((token) => cb({ token }))
          .catch(() => cb({ token: null }));
      },
    });

    socket.on("connect", () => {
      socket.emit("workspace:join", { workspaceId });
    });
    socket.on("message:created", (payload) => {
      handlersRef.current.onMessageCreated?.(payload);
    });
    socket.on("conversation:updated", (payload) => {
      handlersRef.current.onConversationUpdated?.(payload);
    });

    return () => {
      socket.disconnect();
    };
    // getToken is stable per Clerk docs; workspaceId drives reconnects.
  }, [workspaceId, getToken]);
};
