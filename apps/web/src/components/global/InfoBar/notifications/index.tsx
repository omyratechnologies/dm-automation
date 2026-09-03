"use client";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const Notifications = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock notifications data
  const notifications: Notification[] = [
    // {
    //   id: 1,
    //   title: "New automation created",
    //   message: "Your Instagram auto-reply is now active",
    //   time: "2 minutes ago",
    //   read: false,
    // },
    // {
    //   id: 2,
    //   title: "Comment received",
    //   message: "Someone commented on your post",
    //   time: "1 hour ago",
    //   read: false,
    // },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
        aria-expanded={showDropdown}
        aria-haspopup="dialog"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-pink-500" />
          )}
        </div>
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Notifications</h3>
              {notifications.length > 0 && (
                <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold mb-1">No notifications yet</p>
                <p className="text-sm text-muted-foreground text-center">
                  We&apos;ll notify you when something important happens
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-border hover:bg-accent transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted">
              <button className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
