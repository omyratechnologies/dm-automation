"use client";

import { cn } from "@/lib/utils";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  GitBranch,
  MessageSquare,
  Sparkles,
  Tag,
  Timer,
  UserRound,
  UserCheck,
  Zap,
} from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import FlowPostSelector from "./post-selector";

/* ------------------------------------------------------------------ */
/* Context so node components can mutate their own data                */
/* ------------------------------------------------------------------ */

type FlowNodeContextValue = {
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
};

export const FlowNodeContext = createContext<FlowNodeContextValue>({
  updateNodeData: () => {},
});

const useNodeData = (id: string, data: Record<string, unknown>) => {
  const { updateNodeData } = useContext(FlowNodeContext);
  return (patch: Record<string, unknown>) => updateNodeData(id, patch);
};

/* ------------------------------------------------------------------ */
/* Small form controls (all marked nodrag so they stay interactive)    */
/* ------------------------------------------------------------------ */

const inputCls =
  "nodrag w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary/60";

const ChipInput = ({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-1.5 py-0.5 text-[10px] text-foreground"
            >
              {v}
              <button
                className="nodrag text-muted-foreground hover:text-red-500"
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className={inputCls}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
      />
    </div>
  );
};

const MatchTypeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <select
    className={cn(inputCls, "cursor-pointer")}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="contains">Contains</option>
    <option value="exact">Exact match</option>
  </select>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

/* ------------------------------------------------------------------ */
/* Node chrome                                                         */
/* ------------------------------------------------------------------ */

const KIND_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  keyword: { label: "Keyword DM", icon: <Zap className="h-3.5 w-3.5" /> },
  comment: { label: "Post comment", icon: <Zap className="h-3.5 w-3.5" /> },
  story_reply: { label: "Story reply", icon: <Zap className="h-3.5 w-3.5" /> },
  any_message: { label: "Any message", icon: <Zap className="h-3.5 w-3.5" /> },
  text_matches: {
    label: "Text matches",
    icon: <GitBranch className="h-3.5 w-3.5" />,
  },
  has_tag: { label: "Has tag", icon: <GitBranch className="h-3.5 w-3.5" /> },
  within_window: {
    label: "Inside 24h window",
    icon: <GitBranch className="h-3.5 w-3.5" />,
  },
  send_message: {
    label: "Send message",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  ai_reply: { label: "AI reply", icon: <Sparkles className="h-3.5 w-3.5" /> },
  lead_qualify: { label: "Lead Qualifier", icon: <UserCheck className="h-3.5 w-3.5" /> },
  add_tag: { label: "Add tag", icon: <Tag className="h-3.5 w-3.5" /> },
  remove_tag: { label: "Remove tag", icon: <Tag className="h-3.5 w-3.5" /> },
  handoff_human: {
    label: "Handoff to human",
    icon: <UserRound className="h-3.5 w-3.5" />,
  },
  wait: { label: "Wait", icon: <Timer className="h-3.5 w-3.5" /> },
};

const NodeShell = ({
  selected,
  header,
  headerCls,
  icon,
  children,
}: {
  selected?: boolean;
  header: string;
  headerCls: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "w-64 rounded-xl border bg-card shadow-lg overflow-hidden",
      selected ? "border-primary shadow-primary/20" : "border-border"
    )}
  >
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white",
        headerCls
      )}
    >
      {icon}
      {header}
    </div>
    {children && <div className="p-3 space-y-2">{children}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Trigger node                                                        */
/* ------------------------------------------------------------------ */

export const TriggerNode = ({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  const update = useNodeData(id, d);
  const meta = KIND_META[d.kind] ?? { label: d.kind, icon: null };

  return (
    <NodeShell
      selected={selected}
      header={`Trigger · ${meta.label}`}
      headerCls="bg-gradient-to-r from-[#3352CC] to-[#1C2D70]"
      icon={meta.icon}
    >
      {(d.kind === "keyword" ||
        d.kind === "comment" ||
        d.kind === "story_reply") && (
        <>
          <FieldLabel>Keywords</FieldLabel>
          <ChipInput
            values={(d.keywords as string[]) ?? []}
            onChange={(keywords) => update({ keywords })}
            placeholder="Type keyword, press Enter"
          />
          <FieldLabel>Match type</FieldLabel>
          <MatchTypeSelect
            value={(d.matchType as string) ?? "contains"}
            onChange={(matchType) => update({ matchType })}
          />
        </>
      )}
      {d.kind === "comment" && (
        <>
          <FieldLabel>Target Posts</FieldLabel>
          <FlowPostSelector
            selectedPostIds={(d.postIds as string[]) ?? []}
            onChange={(postIds) => update({ postIds })}
          />
        </>
      )}
      {d.kind === "any_message" && (
        <p className="text-xs text-muted-foreground">
          Runs for every inbound DM.
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-[#3352CC] !border-2 !border-background"
      />
    </NodeShell>
  );
};

/* ------------------------------------------------------------------ */
/* Condition node — true/false branch handles                          */
/* ------------------------------------------------------------------ */

export const ConditionNode = ({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  const update = useNodeData(id, d);
  const meta = KIND_META[d.kind] ?? { label: d.kind, icon: null };

  return (
    <div className="relative">
      <NodeShell
        selected={selected}
        header={`Condition · ${meta.label}`}
        headerCls="bg-gradient-to-r from-amber-500 to-orange-600"
        icon={meta.icon}
      >
        {d.kind === "text_matches" && (
          <>
            <FieldLabel>Keywords</FieldLabel>
            <ChipInput
              values={(d.keywords as string[]) ?? []}
              onChange={(keywords) => update({ keywords })}
              placeholder="Type keyword, press Enter"
            />
            <FieldLabel>Match type</FieldLabel>
            <MatchTypeSelect
              value={(d.matchType as string) ?? "contains"}
              onChange={(matchType) => update({ matchType })}
            />
          </>
        )}
        {d.kind === "has_tag" && (
          <>
            <FieldLabel>Tag</FieldLabel>
            <input
              className={inputCls}
              value={(d.tag as string) ?? ""}
              placeholder="e.g. vip"
              onChange={(e) => update({ tag: e.target.value })}
            />
          </>
        )}
        {d.kind === "within_window" && (
          <p className="text-xs text-muted-foreground">
            True when the contact messaged within the last 24 hours.
          </p>
        )}
        <div className="flex justify-between px-1 pt-1 text-[10px] font-semibold">
          <span className="text-green-500">✓ true</span>
          <span className="text-red-500">✗ false</span>
        </div>
      </NodeShell>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-amber-500 !border-2 !border-background"
      />
      <Handle
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ left: "25%" }}
        className="!h-3 !w-3 !bg-green-500 !border-2 !border-background"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ left: "75%" }}
        className="!h-3 !w-3 !bg-red-500 !border-2 !border-background"
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Action node                                                         */
/* ------------------------------------------------------------------ */

export const ActionNode = ({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  const update = useNodeData(id, d);
  const meta = KIND_META[d.kind] ?? { label: d.kind, icon: null };

  return (
    <div className="relative">
      <NodeShell
        selected={selected}
        header={`Action · ${meta.label}`}
        headerCls="bg-gradient-to-r from-emerald-500 to-teal-600"
        icon={meta.icon}
      >
        {d.kind === "send_message" && (
          <>
            <FieldLabel>Message</FieldLabel>
            <textarea
              className={cn(inputCls, "min-h-[64px] resize-none")}
              value={(d.text as string) ?? ""}
              maxLength={1000}
              placeholder="Message to send…"
              onChange={(e) => update({ text: e.target.value })}
            />
            <FieldLabel>Quick replies (max 13)</FieldLabel>
            <ChipInput
              values={(d.quickReplies as string[]) ?? []}
              onChange={(quickReplies) =>
                update({ quickReplies: quickReplies.slice(0, 13) })
              }
              placeholder="Add quick reply"
            />
          </>
        )}
        {(d.kind === "ai_reply" || d.kind === "lead_qualify") && (
          <>
            <FieldLabel>{d.kind === "lead_qualify" ? "Qualification Prompt" : "AI prompt"}</FieldLabel>
            <textarea
              className={cn(inputCls, "min-h-[64px] resize-none")}
              value={(d.prompt as string) ?? ""}
              maxLength={4000}
              placeholder={d.kind === "lead_qualify" ? "Define lead target rules & tone guidelines…" : "Instructions for the AI…"}
              onChange={(e) => update({ prompt: e.target.value })}
            />
          </>
        )}
        {(d.kind === "add_tag" || d.kind === "remove_tag") && (
          <>
            <FieldLabel>Tag</FieldLabel>
            <input
              className={inputCls}
              value={(d.tag as string) ?? ""}
              placeholder="e.g. lead"
              onChange={(e) => update({ tag: e.target.value })}
            />
          </>
        )}
        {d.kind === "wait" && (
          <>
            <FieldLabel>Wait (seconds)</FieldLabel>
            <input
              type="number"
              min={1}
              max={86400}
              className={inputCls}
              value={(d.seconds as number) ?? 60}
              onChange={(e) =>
                update({ seconds: Number(e.target.value) || 1 })
              }
            />
          </>
        )}
        {d.kind === "handoff_human" && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Pauses the bot and flags the conversation for your team.
          </p>
        )}
      </NodeShell>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-background"
      />
    </div>
  );
};

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
