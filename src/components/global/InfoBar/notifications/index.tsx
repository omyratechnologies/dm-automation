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
  const [isExpanded, setIsExpanded] = useState(false);
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
      <div
        className="flex overflow-hidden gap-x-2 border border-border bg-muted backdrop-blur-sm rounded-xl px-4 py-2 items-center transition-all duration-300 hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-lg focus-within:shadow-primary/10 cursor-pointer"
        style={{ width: isExpanded ? "300px" : "44px", height: "40px" }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
          )}
        </div>
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
          }`}
        >
          <span className="text-sm font-medium text-foreground whitespace-nowrap">Notifications</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium ml-2">
            {notifications.length}
          </span>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-card backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-primary/10 z-50 overflow-hidden">
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
