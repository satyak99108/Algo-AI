"use client";

import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Brain, CheckCircle2, FileText, Loader2, MessageSquare, Upload } from "lucide-react";
import { api } from "@/lib/api";

export default function IngestPage() {
  // AI Status
  const [aiStatus, setAiStatus] = useState<any>(null);
  
  // Forms state
  const [textInput, setTextInput] = useState("");
  const [textLabel, setTextLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History state
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
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case 'processing': return <Badge variant="secondary" className="animate-pulse">Processing</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Ingestion</h1>
          <p className="text-muted-foreground mt-1">
            Feed raw information to the AI to extract structured knowledge.
          </p>
        </div>
        
        {/* AI Status Badge */}
        {aiStatus && (
          <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${aiStatus.available ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            <Brain className="size-4" />
            <span className="font-medium">
              {aiStatus.available ? `AI Ready (${aiStatus.provider})` : 'AI Unavailable'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Ingestion Area (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass">
            <Tabs defaultValue="text" className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Add Knowledge</CardTitle>
                  <TabsList>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <MessageSquare className="size-4" /> Text
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <FileText className="size-4" /> File
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                
                {/* Text Tab */}
                <TabsContent value="text" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source Label (optional)</label>
                    <Input 
                      placeholder="e.g. Slack #general, Client meeting notes" 
                      value={textLabel}
                      onChange={(e) => setTextLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Raw Text</label>
                    <Textarea 
                      placeholder="Paste conversation or notes here..." 
                      className="min-h-[200px]"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleTextSubmit}
                    disabled={isSubmitting || !textInput.trim() || !aiStatus?.available}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Processing with AI...</>
                    ) : (
                      <><Brain className="mr-2 size-4" /> Extract Knowledge</>
                    )}
                  </Button>
                </TabsContent>

                {/* File Tab */}
                <TabsContent value="file" className="space-y-4 mt-0">
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 transition-colors">
                    <div className="p-4 bg-muted rounded-full">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Click to select a file</p>
                      <p className="text-sm text-muted-foreground mt-1">Supports PDF, DOCX, TXT</p>
                    </div>
                    <Input 
                      type="file" 
                      className="max-w-xs" 
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {file && (
                    <div className="text-sm flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                  <Button 
                    className="w-full" 
                    onClick={handleFileSubmit}
                    disabled={isSubmitting || !file || !aiStatus?.available}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Processing with AI...</>
                    ) : (
                      <><Brain className="mr-2 size-4" /> Extract Knowledge</>
                    )}
                  </Button>
                </TabsContent>

              </CardContent>
            </Tabs>
          </Card>

          {/* Results Area */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="size-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Ingestion Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="size-5" />
                  <CardTitle className="text-lg">Knowledge Extracted</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{result.entities_created}</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Entities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{result.relationships_created}</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Relations</p>
                  </div>
                </div>

                {result.extractions?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Extracted Items:</p>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {result.extractions.map((ex: any, i: number) => (
                        <div key={i} className="text-sm p-3 bg-background/50 border rounded-md">
                          {ex.type === 'entity' ? (
                            <div className="flex items-center justify-between">
                              <span>
                                <Badge variant="outline" className="mr-2">{ex.entity_type}</Badge>
                                <span className="font-medium">{ex.name}</span>
                              </span>
                              <Badge variant="secondary" className="text-xs">{ex.action}</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ex.source_name}</span>
                              <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">{ex.relationship_type}</Badge>
                              <span className="font-medium">{ex.target_name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar History (1/3 width) */}
        <div className="space-y-6">
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recent Sources</CardTitle>
              <CardDescription>Documents and texts ingested.</CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No sources ingested yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map(s => (
                    <div key={s.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-background/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {s.source_type === 'document' ? 
                            <FileText className="size-4 shrink-0 text-muted-foreground" /> : 
                            <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                          }
                          <span className="font-medium text-sm truncate">{s.filename}</span>
                        </div>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                        {s.extracted_entities?.entities_created !== undefined && (
                          <span>{s.extracted_entities.entities_created} entities</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
