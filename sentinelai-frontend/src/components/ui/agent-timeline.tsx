import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionBadge } from "@/components/ui/execution-badges";
import { Agent, SecurityResult, OverallAction } from "@/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Code,
  Brain,
  Bot,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    { key: "L2", label: "L2 Guardrails", result: result.L2 },
    { key: "L3", label: "L3 Compliance", result: result.L3 },
    { key: "llama_guard", label: "Llama Guard", result: result.llama_guard },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground">{layer.label}:</span>
          <div className="flex items-center space-x-2">
            {layer.result.flagged ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span
              className={
                layer.result.flagged ? "text-red-600" : "text-green-600"
              }
            >
              {layer.result.flagged ? "Flagged" : "Safe"}
            </span>
            {layer.result.flagged && (
              <Badge variant="outline" className="text-xs">
                {layer.result.category}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Props for TimelineItem component
 */
interface TimelineItemProps {
  agent: Agent;
  isLast: boolean;
  className?: string;
}

/**
 * Individual timeline item component for agent execution
 */
function TimelineItem({ agent, isLast, className }: TimelineItemProps) {
  const getAgentIcon = (agentName: string) => {
    if (agentName.toLowerCase().includes("planner"))
      return <Brain className="h-4 w-4" />;
    if (agentName.toLowerCase().includes("coder"))
      return <Code className="h-4 w-4" />;
    return <Bot className="h-4 w-4" />;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border"></div>
      )}

      {/* Timeline dot */}
      <div className="relative flex items-start space-x-4">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center",
            agent.action === "allowed"
              ? "bg-green-100 border-green-300 text-green-600"
              : "bg-red-100 border-red-300 text-red-600"
          )}
        >
          {getAgentIcon(agent.agent_name)}
        </div>

        {/* Timeline content */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Agent: {agent.agent_name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <ActionBadge action={agent.action} />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(agent.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task description */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Task
              </h4>
              <p className="text-sm">{agent.task}</p>
            </div>

            {/* Agent output */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Output
              </h4>
              <div className="bg-muted p-3 rounded-md text-sm font-mono">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(agent.output, null, 2)}
                </pre>
              </div>
            </div>

            {/* Security results */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Security Check
              </h4>
              <SecurityResultDisplay result={agent.sentinel_result} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Props for AgentTimeline component
 */
interface AgentTimelineProps {
  agents: Agent[];
  className?: string;
}

/**
 * Timeline component showing the execution flow of all agents
 */
export function AgentTimeline({ agents, className }: AgentTimelineProps) {
  if (agents.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">
          No agents have been executed yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {agents.map((agent, index) => (
        <TimelineItem
          key={`${agent.agent_name}-${index}`}
          agent={agent}
          isLast={index === agents.length - 1}
        />
      ))}
    </div>
  );
}
