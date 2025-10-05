"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Execution, RiskLevel } from "@/types";

/**
 * Props for Recent Executions component
 */
interface RecentExecutionsProps {
  executions: Execution[] | null;
  loading?: boolean;
}

/**
 * Get risk badge variant based on risk level
 */
function getRiskBadgeVariant(risk: RiskLevel) {
  switch (risk) {
    case "LOW":
      return "default"; // Green
    case "MEDIUM":
      return "secondary"; // Yellow/Orange
    case "HIGH":
      return "outline"; // Orange
    case "CRITICAL":
      return "destructive"; // Red
    default:
      return "default";
  }
}

/**
 * Get risk badge color classes
 */
function getRiskBadgeColor(risk: RiskLevel) {
  switch (risk) {
    case "LOW":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
    default:
      return "";
  }
}

/**
 * Individual execution list item
 */
interface ExecutionItemProps {
  execution: Execution;
}

function ExecutionItem({ execution }: ExecutionItemProps) {
  // Truncate long prompts
  const truncatedPrompt =
    execution.user_prompt.length > 60
      ? `${execution.user_prompt.substring(0, 60)}...`
      : execution.user_prompt;

  return (
    <Link
      href={`/explorer/${execution.execution_id}`}
      className="block hover:bg-muted/50 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-start justify-between space-x-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {truncatedPrompt}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {execution.agents.length > 0
                  ? `${execution.agents[0].agent_name} • ${execution.status}`
                  : execution.status}
              </p>
            </div>
          </div>
        </div>

        {/* Risk badge and timestamp */}
        <div className="flex flex-col items-end space-y-1 flex-shrink-0">
          <Badge
            variant={getRiskBadgeVariant(execution.overall_risk)}
            className={getRiskBadgeColor(execution.overall_risk)}
          >
            {execution.overall_risk}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(execution.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Loading skeleton for execution items
 */
function ExecutionItemSkeleton() {
  return (
    <div className="p-3">
      <div className="flex items-start justify-between space-x-4">
        <div className="flex items-start space-x-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-muted animate-pulse mt-2" />
          <div className="flex-1">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Recent Executions card component showing the latest AI agent security monitoring
 */
export function RecentExecutions({
  executions,
  loading,
}: RecentExecutionsProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>
              Latest AI agent security monitoring
            </CardDescription>
          </div>
          <Link href="/explorer">
            <Button variant="outline" size="sm">
              View All
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <ExecutionItemSkeleton key={i} />
            ))
          ) : executions && executions.length > 0 ? (
            // Show the 5-8 most recent executions
            executions
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .slice(0, 6)
              .map((execution) => (
                <ExecutionItem key={execution._id} execution={execution} />
              ))
          ) : (
            // No data state
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent executions found</p>
              <p className="text-sm">
                New executions will appear here once your agents start running
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
