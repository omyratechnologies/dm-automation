"use client";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React, { useState } from "react";

type Props = {};

function Search({}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="flex overflow-hidden gap-x-2 border border-border bg-card backdrop-blur-sm rounded-xl px-2 py-[2px] items-center transition-all duration-300 hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-lg focus-within:shadow-primary/10"
      style={{ width: isExpanded ? "300px" : "44px" }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={(e) => {
        // Only collapse if not focused on input
        if (!e.currentTarget.contains(document.activeElement)) {
          setIsExpanded(false);
        }
      }}
    >
      <SearchIcon className="text-muted-foreground w-4 h-4 flex-shrink-0 cursor-pointer" />
      <Input
        placeholder="Search by name, email or status"
        className={`border-none outline-none ring-0 focus:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground text-sm transition-all duration-300 ${
          isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
        onBlur={() => setIsExpanded(false)}
      />
    </div>
  );
}

export default Search;
