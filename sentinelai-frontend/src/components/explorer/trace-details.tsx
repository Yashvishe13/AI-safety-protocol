"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  Bug,
} from "lucide-react";
import { useExplorerStore } from "@/store";
import { mockTraceDetails, mockTraceList } from "@/data/mock-data";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Empty state when no trace is selected
 */
function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Select a trace to view details
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Choose a trace from the list to see detailed execution analysis,
          security assessments, and performance metrics.
        </p>
      </div>
    </div>
  );
}

/**
 * Timeline component showing L1/L2/L3 phases
 */
function ExecutionTimeline({ traceId }: { traceId: string }) {
  const details = mockTraceDetails[traceId];
  if (!details) return null;

  const phases = [
    {
      name: "L1 Firewall",
      icon: Shield,
      result: details.l1_firewall.result,
      confidence: details.l1_firewall.confidence,
      duration: details.l1_firewall.scan_duration,
      threats: details.l1_firewall.threats_detected.length,
    },
    {
      name: "L2 Guardrail",
      icon: AlertTriangle,
      result: details.l2_guardrail.actions_blocked > 0 ? "BLOCKED" : "PASSED",
      confidence: Math.round(
        (details.l2_guardrail.actions_allowed /
          details.l2_guardrail.actions_evaluated) *
          100
      ),
      duration: 0, // Not specified in mock data
      threats: details.l2_guardrail.actions_blocked,
    },
    {
      name: "L3 Debug",
      icon: Bug,
      result: details.l3_debug.errors.length > 0 ? "ERRORS" : "CLEAN",
      confidence: 100,
      duration: 0,
      threats:
        details.l3_debug.errors.length + details.l3_debug.warnings.length,
    },
  ];

  const getResultColor = (result: string) => {
    switch (result) {
      case "SAFE":
      case "PASSED":
      case "CLEAN":
        return "text-green-600";
      case "BLOCKED":
      case "SANITIZED":
        return "text-yellow-600";
      case "ERRORS":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "SAFE":
      case "PASSED":
      case "CLEAN":
        return CheckCircle;
      case "BLOCKED":
      case "SANITIZED":
      case "ERRORS":
        return XCircle;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => {
        const Icon = phase.icon;
        const ResultIcon = getResultIcon(phase.result);

        return (
          <Card key={phase.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-semibold">{phase.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Phase {index + 1} Security Analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div
                      className={cn(
                        "flex items-center space-x-1",
                        getResultColor(phase.result)
                      )}
                    >
                      <ResultIcon className="h-4 w-4" />
                      <span className="font-medium">{phase.result}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {phase.confidence}% confidence
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Raw logs display
 */
function RawLogsTab({ traceId }: { traceId: string }) {
  const details = mockTraceDetails[traceId];
  if (!details) return <div>No logs available</div>;

  return (
    <ScrollArea className="h-96">
      <div className="p-4 space-y-2">
        {details.raw_logs.map((log, index) => (
          <div key={index} className="font-mono text-sm bg-muted p-2 rounded">
            {log}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * Performance metrics display
 */
function PerformanceTab({ traceId }: { traceId: string }) {
  const details = mockTraceDetails[traceId];
  if (!details) return <div>No performance data available</div>;

  const metrics = details.l3_debug.performance_metrics;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.cpu_usage}</div>
              <div className="text-sm text-muted-foreground">CPU Usage</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.memory_usage}</div>
              <div className="text-sm text-muted-foreground">Memory</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.api_calls}</div>
              <div className="text-sm text-muted-foreground">API Calls</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold">Execution Path</h4>
        <div className="grid grid-cols-1 gap-2">
          {details.l3_debug.execution_path.map((step, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-muted rounded"
            >
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {index + 1}
              </div>
              <span className="text-sm font-mono">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main trace details component
 */
export function TraceDetails() {
  const { selectedTraceId } = useExplorerStore();

  if (!selectedTraceId) {
    return <EmptyState />;
  }

  // Get basic trace info
  const trace = mockTraceList.find((t) => t.id === selectedTraceId);
  if (!trace) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Trace not found
      </div>
    );
  }

  const details = mockTraceDetails[selectedTraceId];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Trace Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{trace.agent}</h3>
              <p className="text-muted-foreground">{trace.task}</p>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="h-4 w-4 mr-1" />
                Create Case
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{trace.user_id}</div>
                    <div className="text-sm text-muted-foreground">
                      Session: {trace.session_id}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {trace.duration}s execution
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(trace.timestamp), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk and Status */}
          <div className="flex items-center space-x-4">
            <Badge
              variant={
                trace.risk_level === "CRITICAL"
                  ? "destructive"
                  : trace.risk_level === "HIGH"
                  ? "secondary"
                  : trace.risk_level === "MEDIUM"
                  ? "outline"
                  : "default"
              }
            >
              {trace.risk_level} RISK ({trace.risk_score}/100)
            </Badge>
            <Badge variant="outline">{trace.status}</Badge>
          </div>
        </div>

        <Separator />

        {/* Output Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Output Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{trace.output}</p>
          </CardContent>
        </Card>

        {/* Execution Timeline */}
        <div>
          <h4 className="text-lg font-semibold mb-4">
            Security Analysis Pipeline
          </h4>
          <ExecutionTimeline traceId={selectedTraceId} />
        </div>

        {/* Detailed Tabs */}
        {details && (
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs">Raw Logs</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>
                    Raw system logs from trace execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <RawLogsTab traceId={selectedTraceId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    System resource usage and execution path
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PerformanceTab traceId={selectedTraceId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Guardrail Actions</CardTitle>
                  <CardDescription>
                    L2 security actions and decisions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {details.l2_guardrail.actions.map((action, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{action.type}</div>
                              <div className="text-sm text-muted-foreground">
                                {action.description}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  action.decision === "ALLOW"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {action.decision}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                Risk: {action.risk_score}/100
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {action.reasoning}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ScrollArea>
  );
}
