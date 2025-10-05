import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/execution-badges";
import { Execution } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { User, Clock, MessageSquare } from "lucide-react";

/**
 * Props for ExecutionCard component
 */
interface ExecutionCardProps {
  execution: Execution;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

/**
 * Card component for displaying execution information in the list view
 */
export function ExecutionCard({
  execution,
  onClick,
  isSelected = false,
  className,
}: ExecutionCardProps) {
  // Calculate execution duration
  const duration =
    execution.agents.length > 0
      ? `${execution.agents.length} agents`
      : "No agents";

  // Get the last agent name for display
  const lastAgent =
    execution.agents.length > 0
      ? execution.agents[execution.agents.length - 1].agent_name
      : "None";

  // Truncate prompt text
  const truncatedPrompt =
    execution.user_prompt.length > 60
      ? `${execution.user_prompt.substring(0, 60)}...`
      : execution.user_prompt;

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(execution.created_at), {
    addSuffix: true,
  });

  // Generate status message based on execution state
  const getStatusMessage = () => {
    if (execution.status === "BLOCKED" && execution.blocked_by) {
      return `Blocked by ${execution.blocked_by} security layer`;
    }
    if (execution.status === "PROCESSING") {
      return `Processing with ${execution.agents.length} agents...`;
    }
    if (execution.status === "COMPLETED") {
      return `Completed successfully`;
    }
    if (execution.status === "REJECTED") {
      return `Rejected by security filters`;
    }
    return "";
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-border hover:border-primary/30",
        isSelected && "border-primary shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Prompt text with icon */}
        <div className="flex items-start space-x-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-tight">
            {truncatedPrompt}
          </p>
        </div>

        {/* Status message */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">{getStatusMessage()}</p>
        </div>

        {/* Bottom row with agent info, duration, and badges */}
        <div className="flex items-center justify-between">
          {/* Left side - Agent and duration info */}
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{lastAgent}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>
          </div>

          {/* Right side - Risk badge */}
          <RiskBadge risk={execution.overall_risk} />
        </div>

        {/* Status and time info */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
          <StatusBadge status={execution.status} />
        </div>
      </CardContent>
    </Card>
  );
}
