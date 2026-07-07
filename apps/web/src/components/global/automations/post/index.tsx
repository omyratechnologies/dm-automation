import { useAutomationPosts } from "@/hooks/use-automations";
import { useQueryAutomationPosts } from "@/hooks/user-queries";
import React from "react";
import TriggerButton from "../trigger-button";
import { CheckCircle, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Loader from "../../loader";

type Props = {
  id: string;
};

const PostButton = ({ id }: Props) => {
  const { data } = useQueryAutomationPosts();
  const { posts, onSelectPost, onToggleRequireFollow, mutate, isPending } =
    useAutomationPosts(id);

  return (
    <TriggerButton label="Attach a post">
      {data && data.data ? (
        <div className="flex flex-col gap-y-3 w-full">
          <div className="flex flex-wrap w-full gap-3">
            {data.data.map((post) => {
              const selected = posts.find((p) => p.postid === post.id);
              return (
                <div key={post.id} className="w-full">
                  <div
                    className="relative w-full aspect-square rounded-lg cursor-pointer overflow-hidden"
                    onClick={() =>
                      onSelectPost({
                        postid: post.id,
                        media: post.media_url,
                        mediaType: post.media_type,
                        caption: post.caption,
                      })
                    }
                  >
                    {selected && (
                      <CheckCircle
                        fill="white"
                        stroke="black"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                      />
                    )}
                    <Image
                      fill
                      sizes="100vw"
                      src={post.media_url}
                      alt="post image"
                      className={cn(
                        "hover:opacity-75 transition duration-100",
                        selected && "opacity-75",
                      )}
                    />
                  </div>
                  {selected && (
                    <div className="flex items-center gap-x-2 mt-2 px-1">
                      <Switch
                        id={`require-follow-${post.id}`}
                        checked={selected.requireFollow ?? false}
                        onCheckedChange={() =>
                          onToggleRequireFollow(post.id)
                        }
                      />
                      <label
                        htmlFor={`require-follow-${post.id}`}
                        className="text-sm flex items-center gap-x-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Require follow to DM
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            onClick={mutate}
            disabled={posts.length === 0}
            className="bg-gradient-to-br w-full from-[#3352CC] font-medium text-white to-[#1C2D70]"
          >
            <Loader state={isPending}>Attach Post</Loader>
          </Button>
        </div>
      ) : (
        <p className="text-text-secondary text-center">No posts found!</p>
      )}
    </TriggerButton>
  );
};

export default PostButton;
