"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, CheckCircle2, FileText, Loader2, MessageSquare, Upload, Terminal, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function IngestPage() {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const [textLabel, setTextLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    fetchAiStatus();
    fetchSources();
  }, []);

  const fetchAiStatus = async () => {
    try {
      const res = await api.getAiStatus();
      setAiStatus(res);
    } catch (err) {
      console.error("Failed to fetch AI status", err);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await api.listSources(1, 10);
      setSources(res.items);
    } catch (err) {
      console.error("Failed to fetch sources", err);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.ingestText(textInput, textLabel || "Pasted text");
      setResult(res);
      fetchSources();
      setTextInput("");
      setTextLabel("");
    } catch (err: any) {
      setError(err.message || "Failed to ingest text");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.uploadFile(file);
      setResult(res);
      fetchSources();
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Completed</span>;
      case 'processing': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse">Processing</span>;
      case 'failed': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-destructive/30 bg-destructive/10 text-destructive">Failed</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-foreground/20 text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-16 py-6 max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-foreground/10">
        <div>
          <div className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
            <span className="w-8 h-px bg-foreground/30" />
            Process & Pipeline
          </div>
          <h1 className="text-3xl lg:text-5xl font-display tracking-tight">
            Data Ingestion Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Feed raw unstructured texts, specs, or documents into Gemini to extract nodes and graph edges.
          </p>
        </div>

        {/* AI Readiness Status */}
        {aiStatus && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-foreground/15 bg-foreground/[0.03] text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${aiStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`} />
            <span>{aiStatus.available ? `Gemini AI Engine Online (${aiStatus.provider})` : 'AI Unavailable'}</span>
          </div>
        )}
      </div>

      {/* 3-Step Process Header */}
      <div className="grid md:grid-cols-3 gap-6 font-sans">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card/40 flex items-start gap-4">
          <span className="font-display text-2xl font-light text-muted-foreground">I</span>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Upload Source</h3>
            <p className="text-xs text-muted-foreground mt-1">Submit text logs or PDF/DOCX files</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card/40 flex items-start gap-4">
          <span className="font-display text-2xl font-light text-muted-foreground">II</span>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Extract Knowledge</h3>
            <p className="text-xs text-muted-foreground mt-1">Gemini parses entities & relations</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card/40 flex items-start gap-4">
          <span className="font-display text-2xl font-light text-muted-foreground">III</span>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Graph Sync</h3>
            <p className="text-xs text-muted-foreground mt-1">Connect into operational model</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Ingestion Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl border border-foreground/10 bg-card/60">
            <Tabs defaultValue="text" className="w-full">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-foreground/10">
                <span className="font-display text-lg font-semibold">Source Input</span>
                <TabsList className="bg-foreground/5 p-1 rounded-full border border-foreground/10">
                  <TabsTrigger value="text" className="rounded-full text-xs font-mono px-4 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background">
                    <MessageSquare className="size-3.5 mr-1.5" /> Text
                  </TabsTrigger>
                  <TabsTrigger value="file" className="rounded-full text-xs font-mono px-4 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background">
                    <FileText className="size-3.5 mr-1.5" /> Document
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Text Input */}
              <TabsContent value="text" className="space-y-5 mt-0">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Source Label (Optional)</label>
                  <Input 
                    placeholder="e.g. Q3 Architecture Review Notes" 
                    value={textLabel}
                    onChange={(e) => setTextLabel(e.target.value)}
                    className="rounded-xl border-foreground/15 bg-background/50 focus:border-foreground text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Unstructured Content</label>
                  <Textarea 
                    placeholder="Paste meeting notes, Slack conversations, decision logs, or project specs here..." 
                    className="min-h-[220px] rounded-xl border-foreground/15 bg-background/50 focus:border-foreground text-sm font-sans"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleTextSubmit}
                  disabled={isSubmitting || !textInput.trim() || !aiStatus?.available}
                  className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium h-12 text-sm transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Processing Knowledge Extraction…</>
                  ) : (
                    <><Brain className="mr-2 size-4" /> Run Entity & Graph Extraction</>
                  )}
                </Button>
              </TabsContent>

              {/* File Input */}
              <TabsContent value="file" className="space-y-5 mt-0">
                <div className="border-2 border-dashed border-foreground/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-foreground/40 hover:bg-foreground/[0.02] transition-all">
                  <div className="size-12 rounded-full bg-foreground/10 flex items-center justify-center">
                    <Upload className="size-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-medium text-base">Select Document to Ingest</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">Supports PDF, DOCX, TXT formats</p>
                  </div>
                  <Input 
                    type="file" 
                    className="max-w-xs cursor-pointer text-xs" 
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                {file && (
                  <div className="text-xs font-mono flex items-center justify-between p-4 border border-foreground/15 rounded-xl bg-background/50">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-cyan-400" />
                      <span className="font-medium text-foreground">{file.name}</span>
                    </div>
                    <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
                <Button 
                  onClick={handleFileSubmit}
                  disabled={isSubmitting || !file || !aiStatus?.available}
                  className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium h-12 text-sm transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Uploading & Parsing File…</>
                  ) : (
                    <><Brain className="mr-2 size-4" /> Extract Knowledge from File</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-5 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive flex items-start gap-3 text-sm">
              <AlertCircle className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Ingestion Failed</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Extraction Result Box */}
          {result && (
            <div className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 space-y-6">
              <div className="flex items-center gap-2 text-emerald-400 font-display text-lg font-semibold">
                <CheckCircle2 className="size-5" />
                <span>Knowledge Extraction Complete</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl border border-foreground/10 bg-background/50">
                  <p className="text-3xl font-display font-bold text-foreground">{result.entities_created}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">Entities Created</p>
                </div>
                <div className="p-4 rounded-2xl border border-foreground/10 bg-background/50">
                  <p className="text-3xl font-display font-bold text-foreground">{result.relationships_created}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">Relationships Linked</p>
                </div>
              </div>

              {result.extractions?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Extracted Graph Nodes:</p>
                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-2">
                    {result.extractions.map((ex: any, i: number) => (
                      <div key={i} className="text-xs font-mono p-3 rounded-xl border border-foreground/10 bg-background/70 flex items-center justify-between">
                        {ex.type === 'entity' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full border border-foreground/20 text-[10px] text-cyan-400">{ex.entity_type}</span>
                            <span className="font-semibold text-foreground">{ex.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{ex.source_name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{ex.relationship_type}</span>
                            <span className="text-foreground">{ex.target_name}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-emerald-400 font-mono">{ex.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optimus Studio Terminal Inspector & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Optimus Code Monitor Terminal Box */}
          <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-foreground/10 flex items-center justify-between bg-foreground/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Terminal className="size-3" /> ingestion_worker.ts
              </span>
            </div>
            <div className="p-6 font-mono text-xs space-y-3 leading-relaxed text-muted-foreground">
              <div className="text-foreground/70">
                <span className="text-muted-foreground/40 w-6 inline-block">1</span>
                <span className="text-purple-400">import</span> &#123; GeminiExtractor &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'@optimus/ai'</span>
              </div>
              <div className="text-foreground/70">
                <span className="text-muted-foreground/40 w-6 inline-block">2</span>
                <span className="text-purple-400">const</span> pipeline = <span className="text-cyan-400">new</span> GeminiExtractor()
              </div>
              <div className="text-foreground/70">
                <span className="text-muted-foreground/40 w-6 inline-block">3</span>
                pipeline.<span className="text-cyan-400">on</span>(<span className="text-emerald-400">'extract'</span>, (nodes) =&gt; syncGraph(nodes))
              </div>
              <div className="text-foreground/70 pt-2 flex items-center gap-2 border-t border-foreground/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400">Ready to extract entities</span>
              </div>
            </div>
          </div>

          {/* Ingested Sources History Card */}
          <div className="p-6 rounded-3xl border border-foreground/10 bg-card/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h3 className="font-display font-semibold text-base">Ingestion History</h3>
              <span className="text-xs font-mono text-muted-foreground">{sources.length} sources</span>
            </div>

            {sources.length === 0 ? (
              <div className="text-center py-10 text-xs font-mono text-muted-foreground">
                No sources ingested yet. Submit text above.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {sources.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl border border-foreground/10 bg-background/50 space-y-2 hover:bg-foreground/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {s.source_type === 'document' ? 
                          <FileText className="size-4 shrink-0 text-cyan-400" /> : 
                          <MessageSquare className="size-4 shrink-0 text-purple-400" />
                        }
                        <span className="font-sans font-medium text-xs text-foreground truncate">{s.filename}</span>
                      </div>
                      {getStatusBadge(s.status)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-foreground/5">
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      {s.extracted_entities?.entities_created !== undefined && (
                        <span className="text-foreground font-semibold">{s.extracted_entities.entities_created} entities</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

