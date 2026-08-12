"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Brain,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
  ArrowRight,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription } from "@/components/ui/attachment";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { api } from "@/lib/api";
import { ENTITY_CONFIG } from "@/lib/constants";
import type { CopilotAnswerResponse, CopilotSuggestion, EntityType } from "@/types/entities";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  response?: CopilotAnswerResponse;
  loading?: boolean;
}

export default function CompanyCopilotPage() {
  const [inputQuestion, setInputQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    api
      .getCopilotSuggestions()
      .then((data) => setSuggestions(data))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  const handleAsk = useCallback(
    async (questionText?: string) => {
      const q = (questionText || inputQuestion).trim();
      if (!q || isAsking) return;

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now()}`;
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: q,
        timestamp: now,
      };

      const loadingAiMessage: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "Searching operational memory and analyzing evidence provenance...",
        timestamp: now,
        loading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingAiMessage]);
      setInputQuestion("");
      setIsAsking(true);

      try {
        const res = await api.askCopilot(q);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: res.answer,
                  response: res,
                  loading: false,
                }
              : msg
          )
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: err.message || "Failed to query company copilot.",
                  loading: false,
                }
              : msg
          )
        );
      } finally {
        setIsAsking(false);
      }
    },
    [inputQuestion, isAsking]
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-130px)] max-w-[1300px] mx-auto py-2">
      {/* Optimus Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-foreground/10 shrink-0">
        <div>
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
            <span className="w-8 h-px bg-foreground/30" />
            AI Knowledge Copilot
          </div>
          <h1 className="text-2xl lg:text-4xl font-display tracking-tight flex items-center gap-2">
            Company Knowledge Copilot
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              ● Live Index
            </span>
          </h1>
        </div>
        <p className="text-xs font-mono text-muted-foreground max-w-md">
          Ask natural language questions backed by real evidence quotes and confidence metrics.
        </p>
      </div>

      {/* Suggested Questions Pill Row */}
      {messages.length === 0 && (
        <div className="space-y-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Lightbulb className="size-3.5 text-amber-400" />
            <span>Suggested Prompts (Click to Query):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestions.map((s, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={idx}
                  onClick={() => handleAsk(s.question)}
                  className="cursor-pointer p-4 rounded-2xl border border-foreground/10 bg-card/60 hover:bg-foreground/[0.04] transition-all duration-300 hover:-translate-y-0.5 space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">{numStr}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-foreground/15 text-muted-foreground uppercase">
                      {s.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-display font-semibold text-foreground group-hover:translate-x-1 transition-transform">
                    {s.question}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Thread Canvas */}
      <div className="flex-1 overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 flex flex-col min-h-0">
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-6 p-2">
                  <Marker variant="separator">
                    <MarkerContent className="font-mono text-xs text-muted-foreground bg-background px-4 py-1 rounded-full border border-foreground/10">
                      Operational Memory AI Studio
                    </MarkerContent>
                  </Marker>

                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <Message align={message.role === "user" ? "end" : "start"}>
                        <MessageAvatar>
                          <Avatar className="size-8 border border-foreground/15">
                            <AvatarFallback className={message.role === "user" ? "bg-foreground text-background text-xs font-mono font-bold" : "bg-emerald-500/20 text-emerald-400 text-xs"}>
                              {message.role === "user" ? "YOU" : <Brain className="size-4" />}
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>

                        <MessageContent>
                          <MessageHeader className="text-xs font-mono text-muted-foreground">
                            {message.role === "user" ? "User Query" : "Knowledge Copilot"}
                          </MessageHeader>

                          {/* Message Surface */}
                          <Bubble
                            variant={message.role === "user" ? "default" : "secondary"}
                            align={message.role === "user" ? "end" : "start"}
                            className="rounded-2xl"
                          >
                            <BubbleContent className={`text-sm leading-relaxed font-sans ${message.loading ? "animate-pulse font-mono text-xs text-emerald-400" : ""}`}>
                              {message.content}
                            </BubbleContent>
                          </Bubble>

                          {/* Copilot Response Evidence Breakdown */}
                          {message.response && (
                            <div className="flex flex-col gap-3 mt-2 max-w-[90%]">
                              {/* Confidence Badge */}
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1.5">
                                  <ShieldCheck className="size-3.5" />
                                  {Math.round(message.response.confidence * 100)}% Confidence Match
                                </span>
                              </div>

                              {/* Evidence Attachments */}
                              {message.response.evidence && message.response.evidence.length > 0 && (
                                <div className="flex flex-col gap-2">
                                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <FileText className="size-3 text-cyan-400" />
                                    Evidence Provenance ({message.response.evidence.length})
                                  </span>

                                  <AttachmentGroup className="flex-col gap-2">
                                    {message.response.evidence.map((ev, idx) => (
                                      <Attachment key={idx} state="done" size="sm" className="w-full bg-background/70 border border-foreground/10 rounded-xl">
                                        <AttachmentMedia variant="icon">
                                          <FileText className="size-4 text-emerald-400" />
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                          <AttachmentTitle className="text-xs font-mono font-semibold text-foreground">
                                            {ev.source_name}
                                          </AttachmentTitle>
                                          <AttachmentDescription className="text-xs italic text-foreground/80 line-clamp-2">
                                            &ldquo;{ev.quote}&rdquo;
                                          </AttachmentDescription>
                                        </AttachmentContent>
                                      </Attachment>
                                    ))}
                                  </AttachmentGroup>
                                </div>
                              )}

                              {/* Mentioned Entities */}
                              {message.response.mentioned_entities && message.response.mentioned_entities.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[11px] font-mono text-muted-foreground">Related Nodes:</span>
                                  {message.response.mentioned_entities.map((ent, idx) => {
                                    return (
                                      <span key={idx} className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-foreground/15 bg-foreground/5 text-foreground flex items-center gap-1">
                                        <span>{ent.name}</span>
                                        {ent.id && (
                                          <Link href={`/entities/${ent.type}/${ent.id}`} className="hover:text-cyan-400">
                                            <ExternalLink className="size-2.5" />
                                          </Link>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <MessageFooter className="text-[10px] font-mono text-muted-foreground">
                            {message.timestamp}
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        {/* Optimus Input Bar */}
        <div className="p-4 bg-background/80 border-t border-foreground/10 flex items-center gap-3">
          <Input
            placeholder="Ask anything about onboarding, team decisions, specs, or task ownership..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            className="bg-card/60 border-foreground/15 rounded-full px-5 h-12 text-sm focus:border-foreground flex-1"
          />
          <Button
            onClick={() => handleAsk()}
            disabled={!inputQuestion.trim() || isAsking}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 h-12 text-xs font-medium gap-2 shrink-0 transition-all"
          >
            <Send className="size-3.5" />
            Ask Copilot
          </Button>
        </div>
      </div>
    </div>
  );
}

