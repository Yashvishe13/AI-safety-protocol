"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, Activity } from "lucide-react";
import { useExplorerStore } from "@/store";
import { mockTraceList } from "@/data/mock-data";
import { TraceListItem } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Individual trace item card component
 */
interface TraceItemProps {
  trace: TraceListItem;
  isSelected: boolean;
  onClick: () => void;
}

function TraceItem({ trace, isSelected, onClick }: TraceItemProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "BLOCKED":
        return "text-red-600";
      case "PROCESSING":
        return "text-blue-600";
      case "PENDING":
        return "text-yellow-600";
      case "FAILED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        isSelected
          ? "border-l-primary bg-accent/50 shadow-md"
          : "border-l-transparent hover:border-l-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with agent and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{trace.agent}</span>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", getStatusColor(trace.status))}
          >
            {trace.status}
          </Badge>
        </div>

        {/* Task description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {trace.task}
        </p>

        {/* Output summary */}
        <p className="text-xs text-foreground mb-3 line-clamp-2 bg-muted p-2 rounded">
          {trace.output}
        </p>

        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{trace.user_id.replace("user_", "")}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{trace.duration}s</span>
            </div>
          </div>
          <Badge className={cn("text-xs", getRiskColor(trace.risk_level))}>
            {trace.risk_level}
          </Badge>
        </div>

        {/* Timestamp */}
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(trace.timestamp), {
              addSuffix: true,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Scrollable list of trace items with filtering
 */
export function TraceList() {
  const { filters, selectedTraceId, setSelectedTraceId } = useExplorerStore();

  // Filter traces based on current filter settings
  const filteredTraces = useMemo(() => {
    let filtered = [...mockTraceList];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (trace) =>
          trace.agent.toLowerCase().includes(searchLower) ||
          trace.task.toLowerCase().includes(searchLower) ||
          trace.output.toLowerCase().includes(searchLower) ||
          trace.user_id.toLowerCase().includes(searchLower)
      );
    }

    // Agent filter
    if (filters.agent) {
      filtered = filtered.filter((trace) => trace.agent === filters.agent);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((trace) => trace.status === filters.status);
    }

    // Risk level filter
    if (filters.risk) {
      filtered = filtered.filter((trace) => trace.risk_level === filters.risk);
    }

    // Time range filter (simplified - in real app would use actual date filtering)
    // For now, just sort by timestamp descending
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return filtered;
  }, [filters]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {filteredTraces.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No traces match your current filters
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search criteria or clearing filters
            </p>
          </div>
        ) : (
          filteredTraces.map((trace) => (
            <TraceItem
              key={trace.id}
              trace={trace}
              isSelected={selectedTraceId === trace.id}
              onClick={() => setSelectedTraceId(trace.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
