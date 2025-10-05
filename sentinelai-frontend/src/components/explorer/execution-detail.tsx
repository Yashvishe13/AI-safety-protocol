"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  RiskBadge,
  StatusBadge,
  ActionBadge,
} from "@/components/ui/execution-badges";
import { AgentTimeline } from "@/components/ui/agent-timeline";
import { Execution, SecurityResult } from "@/types";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Props for SecuritySummary component
 */
interface SecuritySummaryProps {
  security: SecurityResult;
  title: string;
  className?: string;
}

/**
 * Component to display a summary of security check results
 */
function SecuritySummary({ security, title, className }: SecuritySummaryProps) {
  const layers = [
    { key: "L1", label: "L1 Firewall", result: security.L1 },
    { key: "L2", label: "L2 Guardrails", result: security.L2 },
    { key: "L3", label: "L3 Compliance", result: security.L3 },
    { key: "llama_guard", label: "Llama Guard", result: security.llama_guard },
  ];

  const flaggedCount = layers.filter((layer) => layer.result.flagged).length;
  const allSafe = flaggedCount === 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {allSafe ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All Safe</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {flaggedCount} Issue(s)
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {layers.map((layer) => (
          <div
            key={layer.key}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-medium">{layer.label}</span>
            <div className="flex items-center space-x-2">
              {layer.result.flagged ? (
                <>
                  <XCircle className="h-3 w-3 text-red-500" />
                  <Badge variant="destructive" className="text-xs">
                    {layer.result.category}
                  </Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 text-xs">Safe</span>
                </>
              )}
            </div>
          </div>
        ))}

        {!allSafe && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <strong>Security Issues Detected:</strong>
                <ul className="mt-1 ml-2">
                  {layers
                    .filter((layer) => layer.result.flagged)
                    .map((layer) => (
                      <li key={layer.key} className="text-xs">
                        • {layer.label}: {layer.result.reason}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Props for ExecutionDetail component
 */
interface ExecutionDetailProps {
  executionId: string;
}

/**
 * Detailed view component for a single execution
 */
export function ExecutionDetail({ executionId }: ExecutionDetailProps) {
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch execution details
  const fetchExecution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.executions.getExecutionDetails(executionId);

      if (response.success && response.data) {
        setExecution(response.data);
      } else {
        setError(response.error || "Failed to fetch execution details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error fetching execution details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/explorer");
  };

  // Initial load
  useEffect(() => {
    fetchExecution();
  }, [executionId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="w-32 h-6 bg-muted rounded animate-pulse" />
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-32 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-48 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Execution
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explorer
            </Button>
            <Button onClick={fetchExecution}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Execution Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The execution with ID &ldquo;{executionId}&rdquo; could not be
            found.
          </p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explorer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Execution Details</h1>
            <p className="text-sm text-muted-foreground">
              {execution.execution_id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchExecution}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt and overview */}
          <Card>
            <CardHeader>
              <CardTitle>User Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4">
                {execution.user_prompt}
              </p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(execution.created_at), "PPP p")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(execution.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Execution flow showing all agents and their security checks
              </p>
            </CardHeader>
            <CardContent>
              <AgentTimeline agents={execution.agents} />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Summary and security */}
        <div className="space-y-6">
          {/* Status overview */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <StatusBadge status={execution.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level:</span>
                <RiskBadge risk={execution.overall_risk} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Action:</span>
                <ActionBadge action={execution.overall_action} />
              </div>
              {execution.blocked_by && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Blocked By:</span>
                  <Badge variant="destructive">{execution.blocked_by}</Badge>
                </div>
              )}
              <Separator />
              <div className="text-sm text-muted-foreground">
                <strong>Agents:</strong> {execution.agents.length} total
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Duration:</strong>{" "}
                {formatDistanceToNow(new Date(execution.created_at), {
                  addSuffix: false,
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Security Summary */}
          <SecuritySummary
            security={execution.prompt_security}
            title="Prompt Security Check"
          />
        </div>
      </div>
    </div>
  );
}
