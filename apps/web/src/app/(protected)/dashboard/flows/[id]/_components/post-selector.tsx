"use client";

import React, { useState } from "react";
import { useQueryAutomationPosts } from "@/hooks/user-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Image as ImageIcon, Video, Layers, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  selectedPostIds: string[];
  onChange: (ids: string[]) => void;
};

export default function FlowPostSelector({ selectedPostIds, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const { data, isLoading } = useQueryAutomationPosts();

  const handleOpen = () => {
    setTempSelection(selectedPostIds);
    setIsOpen(true);
  };

  const handleToggle = (postId: string) => {
    setTempSelection((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSave = () => {
    onChange(tempSelection);
    setIsOpen(false);
  };

  const selectedPostsDetails = data?.data?.filter((post) =>
    selectedPostIds.includes(post.id)
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2 nodrag">
        {/* Selected Posts Visual Summary */}
        {selectedPostIds.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 border border-border rounded-xl max-h-[140px] overflow-y-auto">
            {selectedPostsDetails.map((post) => (
              <div 
                key={post.id} 
                className="relative h-10 w-10 rounded-lg overflow-hidden border border-border group"
                title={post.caption || "Instagram Post"}
              >
                <Image
                  src={post.media_url}
                  alt="selected thumbnail"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange(selectedPostIds.filter((id) => id !== post.id))}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center justify-center h-10 px-2 bg-background border border-border/80 rounded-lg text-[10px] text-muted-foreground font-semibold">
              {selectedPostIds.length} chosen
            </div>
          </div>
        ) : (
          <div className="p-3 border border-dashed border-border rounded-xl text-center">
            <p className="text-[10px] text-muted-foreground italic">Runs on comments for ANY post</p>
          </div>
        )}

        <DialogTrigger asChild>
          <Button
            type="button"
            onClick={handleOpen}
            className="w-full text-xs h-8 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold rounded-lg"
          >
            {selectedPostIds.length > 0 ? "Edit Selected Posts" : "Select Specific Posts"}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[600px] max-h-[85vh] bg-card border-border flex flex-col p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Select Instagram Posts
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Fetching profile posts...</p>
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground text-center px-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">No posts found</h3>
            <p className="text-xs leading-relaxed max-w-sm">
              We couldn&apos;t load any posts. Ensure your Instagram Business account is connected properly and contains active posts.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pr-1 my-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {data.data.map((post) => {
                  const isSelected = tempSelection.includes(post.id);
                  return (
                    <div
                      key={post.id}
                      onClick={() => handleToggle(post.id)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group",
                        isSelected 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Image
                        src={post.media_url}
                        alt={post.caption || "media"}
                        fill
                        sizes="(max-width: 600px) 33vw, 150px"
                        className={cn(
                          "object-cover transition-transform duration-300 group-hover:scale-105",
                          isSelected && "opacity-80"
                        )}
                      />

                      {/* Selection Check */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-0.5 rounded-full z-10 shadow-md">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}

                      {/* MediaType Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] text-white flex items-center gap-1">
                        {post.media_type === "VIDEO" && <Video className="h-2.5 w-2.5" />}
                        {post.media_type === "IMAGE" && <ImageIcon className="h-2.5 w-2.5" />}
                        {post.media_type === "CAROSEL_ALBUM" && <Layers className="h-2.5 w-2.5" />}
                        {post.media_type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {tempSelection.length} post(s) selected
              </span>
              <div className="flex gap-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border-border text-foreground hover:bg-accent text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-xl text-xs font-bold px-4 py-2"
                >
                  Save Selection
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
