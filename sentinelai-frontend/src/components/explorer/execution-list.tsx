"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge, StatusBadge } from "@/components/ui/execution-badges";
import { Execution, Agent } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User, Clock, ChevronRight } from "lucide-react";

/**
 * Props for ExecutionListItem component
 */
interface ExecutionListItemProps {
  execution: Execution;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Individual execution item in the list
 */
function ExecutionListItem({
  execution,
  isSelected,
  onClick,
}: ExecutionListItemProps) {
  // Truncate prompt text for list view
  const truncatedPrompt =
    execution.user_prompt.length > 80
      ? `${execution.user_prompt.substring(0, 80)}...`
      : execution.user_prompt;

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(execution.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md mb-2",
        "border-border hover:border-primary/30",
        isSelected && "border-primary shadow-md bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Prompt text */}
        <div className="flex items-start space-x-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-tight flex-1">
            {truncatedPrompt}
          </p>
          {isSelected && <ChevronRight className="h-4 w-4 text-primary" />}
        </div>

        {/* Status and badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StatusBadge status={execution.status} />
            <RiskBadge risk={execution.overall_risk} />
          </div>
        </div>

        {/* Agent count and time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{execution.agents.length} agents</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Props for ExecutionList component
 */
interface ExecutionListProps {
  executions: Execution[];
  selectedExecutionId: string | null;
  onExecutionSelect: (executionId: string) => void;
  loading?: boolean;
}

/**
 * List component showing all executions
 */
export function ExecutionList({
  executions,
  selectedExecutionId,
  onExecutionSelect,
  loading = false,
}: ExecutionListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No executions found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-auto h-full">
      {executions.map((execution) => (
        <ExecutionListItem
          key={execution._id}
          execution={execution}
          isSelected={selectedExecutionId === execution.execution_id}
          onClick={() => onExecutionSelect(execution.execution_id)}
        />
      ))}
    </div>
  );
}
