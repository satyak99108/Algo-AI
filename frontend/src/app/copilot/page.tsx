"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Brain,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  HelpCircle,
  RefreshCw,
  User,
  ArrowRight,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ENTITY_CONFIG, ALL_ENTITY_TYPES } from "@/lib/constants";
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

  // Fetch initial suggestions
  useEffect(() => {
    api
      .getCopilotSuggestions()
      .then((data) => setSuggestions(data))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  // Submit question handler
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
        content: "Searching operational memory and analyzing evidence...",
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
    <div className="flex flex-col gap-4 h-[calc(100vh-100px)] animate-fade-in pb-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary shrink-0">
            <Brain className="size-6 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Company Knowledge Copilot</h1>
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                <Sparkles className="size-3" />
                Phase 4
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Ask natural language questions about your company. Answers are generated using operational memory context backed by explicit evidence quotes and confidence scores.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions Pill Row */}
      {messages.length === 0 && (
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1">
            <Lightbulb className="size-3.5 text-amber-400" />
            <span>Suggested Questions (Ask your company anything)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.map((s, idx) => (
              <Card
                key={idx}
                onClick={() => handleAsk(s.question)}
                className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-card/80 p-3.5 flex flex-col gap-1.5 border-border shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                    {s.category}
                  </Badge>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold text-foreground leading-snug">{s.question}</span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Chat Thread Canvas using shadcn MessageScroller */}
      <Card className="flex-1 overflow-hidden border-border flex flex-col min-h-0 shadow-sm bg-card/30">
        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-6 p-2">
                  <Marker variant="separator">
                    <MarkerContent>Operational Memory Copilot</MarkerContent>
                  </Marker>

                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <Message align={message.role === "user" ? "end" : "start"}>
                        <MessageAvatar>
                          <Avatar className="size-8">
                            <AvatarFallback className={message.role === "user" ? "bg-primary text-primary-foreground text-xs" : "bg-emerald-500/20 text-emerald-400 text-xs"}>
                              {message.role === "user" ? <User className="size-4" /> : <Brain className="size-4" />}
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>

                        <MessageContent>
                          <MessageHeader className="text-xs font-medium text-muted-foreground">
                            {message.role === "user" ? "You" : "Knowledge Copilot"}
                          </MessageHeader>

                          {/* Message Surface */}
                          <Bubble
                            variant={message.role === "user" ? "default" : "secondary"}
                            align={message.role === "user" ? "end" : "start"}
                          >
                            <BubbleContent className={`text-sm leading-relaxed ${message.loading ? "animate-pulse font-mono" : ""}`}>
                              {message.content}
                            </BubbleContent>
                          </Bubble>

                          {/* Copilot Response Evidence Breakdown */}
                          {message.response && (
                            <div className="flex flex-col gap-3 mt-1.5 max-w-[90%]">
                              {/* Confidence Badge */}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="gap-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                >
                                  <ShieldCheck className="size-3.5" />
                                  {Math.round(message.response.confidence * 100)}% Confidence
                                </Badge>
                              </div>

                              {/* Evidence Attachments */}
                              {message.response.evidence && message.response.evidence.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                    <FileText className="size-3 text-primary" />
                                    Evidence Provenance ({message.response.evidence.length})
                                  </span>

                                  <AttachmentGroup className="flex-col gap-2">
                                    {message.response.evidence.map((ev, idx) => (
                                      <Attachment key={idx} state="done" size="sm" className="w-full bg-background/80">
                                        <AttachmentMedia variant="icon">
                                          <FileText className="size-4 text-emerald-400" />
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                          <AttachmentTitle className="text-xs font-bold">
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
                                  <span className="text-[11px] text-muted-foreground">Related Entities:</span>
                                  {message.response.mentioned_entities.map((ent, idx) => {
                                    const cfg = ENTITY_CONFIG[ent.type as EntityType];
                                    return (
                                      <Badge key={idx} variant="outline" className="text-[11px] gap-1 px-2 py-0.5">
                                        <span>{ent.name}</span>
                                        {ent.id && (
                                          <Link href={`/entities/${ent.type}/${ent.id}`} className="hover:text-primary">
                                            <ExternalLink className="size-2.5" />
                                          </Link>
                                        )}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <MessageFooter className="text-[10px] text-muted-foreground">
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
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
          <Input
            placeholder="Ask a question about onboarding, decisions, projects, or workflows..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            className="bg-background flex-1"
          />
          <Button
            onClick={() => handleAsk()}
            disabled={!inputQuestion.trim() || isAsking}
            size="sm"
            className="gap-2 shrink-0"
          >
            <Send className="size-4" data-icon="inline-start" />
            Ask Copilot
          </Button>
        </div>
      </Card>
    </div>
  );
}
