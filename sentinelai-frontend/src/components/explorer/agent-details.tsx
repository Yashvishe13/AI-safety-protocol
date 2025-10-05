"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionBadge } from "@/components/ui/execution-badges";
import { Agent, SecurityResult, Execution } from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Code,
  Brain,
  Bot,
  MessageSquare,
  Check,
  X,
  Zap,
  Cog,
  Users,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

/**
 * Props for SecurityOverrideButtons component
 */
interface SecurityOverrideButtonsProps {
  result: SecurityResult;
  executionId: string;
  agentName?: string;
  isPromptSecurity?: boolean;
  onComplete?: () => void;
}

/**
 * Component for general Accept/Reject buttons that handle all flagged layers
 */
function SecurityOverrideButtons({
  result,
  executionId,
  agentName,
  isPromptSecurity = false,
  onComplete,
}: SecurityOverrideButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "reject" | null
  >(null);

  // Helper function to get all flagged layers
  const getFlaggedLayers = (): Array<"L1" | "L2" | "L3" | "llama_guard"> => {
    const flagged: Array<"L1" | "L2" | "L3" | "llama_guard"> = [];

    if (result.L1.flagged) flagged.push("L1");
    if (result.L2.flagged) flagged.push("L2");
    if (result.L3.flagged) flagged.push("L3");
    if (result.llama_guard.flagged) flagged.push("llama_guard");

    return flagged;
  };

  // Check if there are any flagged layers
  const hasFlaggedLayers = getFlaggedLayers().length > 0;

  // Handle security override for all flagged layers
  const handleSecurityOverride = async (action: "accept" | "reject") => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const flaggedLayers = getFlaggedLayers();

      // Process each flagged layer
      for (const layer of flaggedLayers) {
        const overrideData = {
          layer,
          agent_name: isPromptSecurity ? "Prompt" : agentName || "Unknown",
          action,
          reason: `User ${action}ed all flagged security results${
            isPromptSecurity ? " for prompt" : ` for agent ${agentName}`
          }`,
          user_id: "current-user", // TODO: Replace with actual user ID from auth context
        };

        const response = await api.executions.submitSecurityOverride(
          executionId,
          overrideData
        );

        if (!response.success) {
          throw new Error(
            response.error ||
              `Failed to ${action} security override for ${layer}`
          );
        }
      }

      console.log(
        `Successfully ${action}ed security override${
          isPromptSecurity ? " for prompt" : ` for agent ${agentName}`
        }`
      );

      // Show loading screen for 5 seconds then refresh or call callback
      setTimeout(() => {
        setIsLoading(false);
        setLoadingAction(null);
        if (onComplete) {
          onComplete();
        } else {
          window.location.reload();
        }
      }, 5000);
    } catch (error) {
      console.error(`Error ${action}ing security override:`, error);
      setIsLoading(false);
      setLoadingAction(null);
      // You could add error handling UI here
    }
  };

  // Don't render if no flagged layers
  if (!hasFlaggedLayers) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200">
              Security Override Required
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {isPromptSecurity
                ? "The prompt has flagged security results that need your review."
                : `Agent ${agentName} has flagged security results that need your review.`}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSecurityOverride("accept")}
            disabled={isLoading}
            className="h-8 px-4 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800"
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSecurityOverride("reject")}
            disabled={isLoading}
            className="h-8 px-4 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-800"
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      </div>

      {/* Loading screen overlay */}
      {isLoading && loadingAction && (
        <AgentLoadingScreen
          agentName={
            isPromptSecurity ? "Prompt Security" : agentName || "Agent"
          }
          action={loadingAction}
        />
      )}
    </>
  );
}

/**
 * Loading screen component for agent security override
 */
interface AgentLoadingScreenProps {
  agentName: string;
  action: "accept" | "reject";
}

function AgentLoadingScreen({ agentName, action }: AgentLoadingScreenProps) {
  const acceptMessages = [
    `Agent ${agentName} is processing your ${action} request...`,
    `Analyzing security layers for ${agentName}...`,
    `Updating security protocols...`,
    `Agent ${agentName} is running your code securely...`,
    `Finalizing ${action} action...`,
  ];

  const rejectMessages = [
    `Blocking ${agentName} execution...`,
    `Enforcing security restrictions...`,
    `Quarantining potentially harmful code...`,
    `Updating security blacklist...`,
    `Security override complete - access denied`,
  ];

  const messages = action === "accept" ? acceptMessages : rejectMessages;
  const isReject = action === "reject";

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-96 p-8">
        <CardContent className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto relative">
              <div
                className={cn(
                  "absolute inset-0 border-4 rounded-full",
                  isReject ? "border-red-200" : "border-blue-200"
                )}
              ></div>
              <div
                className={cn(
                  "absolute inset-0 border-4 rounded-full animate-spin border-t-transparent",
                  isReject ? "border-red-600" : "border-blue-600"
                )}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {isReject ? (
                  <Shield className={cn("w-8 h-8", "text-red-600")} />
                ) : (
                  <Bot className={cn("w-8 h-8", "text-blue-600")} />
                )}
              </div>
            </div>
            {isReject ? (
              <XCircle className="w-6 h-6 text-red-500 absolute -top-2 -right-2 animate-pulse" />
            ) : (
              <Zap className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            )}
            <Cog className="w-4 h-4 text-gray-400 absolute -bottom-1 -left-1 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3
              className={cn(
                "text-lg font-semibold",
                isReject ? "text-red-600 dark:text-red-400" : "text-foreground"
              )}
            >
              {isReject
                ? "Blocking Security Threat"
                : "Processing Security Override"}
            </h3>
            <p className="text-sm text-muted-foreground min-h-[40px] flex items-center justify-center">
              {messages[currentMessageIndex]}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentMessageIndex % 3
                      ? isReject
                        ? "bg-red-600"
                        : "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                  style={{
                    animation: `pulse 1.5s ease-in-out infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Props for SecurityResultDisplay component
 */
interface SecurityResultDisplayProps {
  result: SecurityResult;
  className?: string;
}

/**
 * Component to display security check results for all layers
 */
function SecurityResultDisplay({
  result,
  className,
}: SecurityResultDisplayProps) {
  const layers = [
    { key: "L1", label: "L1 Firewall", result: result.L1 },
    { key: "llama_guard", label: "Llama Guard", result: result.llama_guard },
    { key: "L2", label: "L2 Guardrails", result: result.L2 },
    { key: "L3", label: "L3 Compliance", result: result.L3 },
  ];

  const getLlamaGuardColors = () => {
    return {
      background:
        "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
    };
  };

  return (
    <div className={cn("space-y-3", className)}>
      {layers.map((layer) => {
        const isLlamaGuard = layer.key === "llama_guard";
        const metaColors = isLlamaGuard ? getLlamaGuardColors() : null;

        return (
          <div
            key={layer.key}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              isLlamaGuard && metaColors
                ? `${metaColors.background} ${metaColors.border}`
                : "bg-muted/50 border-transparent"
            )}
          >
            <span
              className={cn(
                "font-medium text-sm",
                isLlamaGuard && metaColors ? metaColors.text : ""
              )}
            >
              {layer.label}
            </span>
            <div className="flex items-center space-x-2">
              {layer.result.flagged ? (
                <XCircle
                  className={cn(
                    "h-4 w-4",
                    isLlamaGuard && metaColors
                      ? metaColors.icon
                      : "text-red-500"
                  )}
                />
              ) : (
                <CheckCircle
                  className={cn(
                    "h-4 w-4",
                    isLlamaGuard && metaColors
                      ? metaColors.icon
                      : "text-green-500"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  layer.result.flagged
                    ? isLlamaGuard && metaColors
                      ? metaColors.text
                      : "text-red-600"
                    : isLlamaGuard && metaColors
                    ? metaColors.text
                    : "text-green-600"
                )}
              >
                {layer.result.flagged ? "Flagged" : "Safe"}
              </span>
              {layer.result.flagged && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "text-xs",
                    isLlamaGuard
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : ""
                  )}
                >
                  {layer.result.category}
                </Badge>
              )}
            </div>
          </div>
        );
      })}

      {/* Show flagged reasons */}
      {layers.some((layer) => layer.result.flagged) && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="text-red-700 dark:text-red-400">
                Issues Detected:
              </strong>
              <ul className="mt-1 space-y-1">
                {layers
                  .filter((layer) => layer.result.flagged)
                  .map((layer) => (
                    <li
                      key={layer.key}
                      className="text-red-600 dark:text-red-400 text-xs"
                    >
                      • <strong>{layer.label}:</strong> {layer.result.reason}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Props for AgentDetails component
 */
interface AgentDetailsProps {
  execution: Execution | null;
  selectedAgent: Agent | null;
  className?: string;
}

/**
 * Component showing detailed information about a selected agent
 */
export function AgentDetails({
  execution,
  selectedAgent,
  className,
}: AgentDetailsProps) {
  // Helper function to check if agent has flagged security results
  const hasSecurityFlags = (agent: Agent | null) => {
    if (!agent) return false;
    const result = agent.sentinel_result;
    return (
      result.L1.flagged ||
      result.L2.flagged ||
      result.L3.flagged ||
      result.llama_guard.flagged
    );
  };

  const getAgentIcon = (agentName: string) => {
    if (agentName.toLowerCase().includes("planner"))
      return <Brain className="h-5 w-5" />;
    if (agentName.toLowerCase().includes("coder"))
      return <Code className="h-5 w-5" />;
    if (agentName.toLowerCase().includes("security"))
      return <Shield className="h-5 w-5" />;
    return <Bot className="h-5 w-5" />;
  };

  // Show prompt security details when no agent is selected
  if (!selectedAgent && execution) {
    return (
      <div className={cn("p-6 h-full overflow-auto", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Prompt Security Analysis</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Security analysis results for the initial user prompt
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                User Prompt
              </h4>
              <p className="text-sm leading-relaxed p-3 bg-muted rounded-lg">
                {execution.user_prompt}
              </p>
            </div>

            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    execution.overall_action === "allowed"
                      ? "bg-green-500"
                      : "bg-red-500"
                  )}
                ></div>
                <span className="font-medium">
                  Prompt{" "}
                  {execution.overall_action === "allowed"
                    ? "Approved"
                    : "Blocked"}
                </span>
              </div>
              <ActionBadge action={execution.overall_action} />
            </div>

            {/* Execution Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Execution ID:</span>
                <p className="font-mono text-xs mt-1">
                  {execution.execution_id}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Risk Level:</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      execution.overall_risk === "HIGH" ||
                      execution.overall_risk === "CRITICAL"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {execution.overall_risk}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="mt-1">
                  {format(new Date(execution.created_at), "PPP p")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Agents:</span>
                <p className="mt-1">{execution.agents.length}</p>
              </div>
            </div>

            {/* Security Analysis Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Security Layer Analysis
                </h4>
                {/* Check if prompt has any flagged results */}
                {(execution.prompt_security.L1.flagged ||
                  execution.prompt_security.L2.flagged ||
                  execution.prompt_security.L3.flagged ||
                  execution.prompt_security.llama_guard.flagged) && (
                  <Badge variant="destructive" className="text-xs">
                    Security Review Required
                  </Badge>
                )}
              </div>
              <SecurityResultDisplay result={execution.prompt_security} />

              {/* Security Override Buttons */}
              <SecurityOverrideButtons
                result={execution.prompt_security}
                executionId={execution.execution_id}
                isPromptSecurity={true}
              />
            </div>

            {/* Navigation Hint */}
            <div className="text-center py-4 text-muted-foreground border-t border-border">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">
                Select an agent from the timeline to view individual agent
                execution details
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show agent details when selected
  if (selectedAgent) {
    return (
      <div className={cn("p-6 h-full overflow-auto", className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {getAgentIcon(selectedAgent.agent_name)}
                <span>Agent: {selectedAgent.agent_name}</span>
              </CardTitle>
              <ActionBadge action={selectedAgent.action} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(selectedAgent.timestamp), {
                addSuffix: true,
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task description */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Task
              </h4>
              <p className="text-sm leading-relaxed p-3 bg-muted rounded-lg">
                {selectedAgent.task}
              </p>
            </div>

            {/* Agent output */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Output
              </h4>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedAgent.output, null, 2)}
                </pre>
              </div>
            </div>

            {/* Security results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Agent Security Analysis
                </h4>
                {hasSecurityFlags(selectedAgent) && (
                  <Badge variant="destructive" className="text-xs">
                    Security Review Required
                  </Badge>
                )}
              </div>
              <SecurityResultDisplay result={selectedAgent.sentinel_result} />
              {/* General security override buttons for agent */}
              <SecurityOverrideButtons
                result={selectedAgent.sentinel_result}
                executionId={execution?.execution_id || ""}
                agentName={selectedAgent.agent_name}
              />
            </div>

            {/* Execution timestamp */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Executed at{" "}
                  {format(new Date(selectedAgent.timestamp), "PPP p")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default empty state
  return (
    <div
      className={cn("p-6 h-full flex items-center justify-center", className)}
    >
      <div className="text-center text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Execution Selected</h3>
        <p className="text-sm">
          Select an execution from the left panel to view agent details
        </p>
      </div>
    </div>
  );
}
