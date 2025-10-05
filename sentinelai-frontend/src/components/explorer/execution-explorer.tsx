"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExecutionCard } from "@/components/ui/execution-card";
import { Execution, ExecutionStatus, RiskLevel } from "@/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Filter options for executions
 */
interface ExecutionFilters {
  search?: string;
  status?: ExecutionStatus;
  risk?: RiskLevel;
  timeRange?: string;
}

/**
 * Time range options for filtering
 */
const timeRangeOptions = [
  { label: "Last Hour", value: "1h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

/**
 * Status options for filtering
 */
const statusOptions: { label: string; value: ExecutionStatus }[] = [
  { label: "All Statuses", value: "COMPLETED" as ExecutionStatus }, // This will be handled specially
  { label: "Completed", value: "COMPLETED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Rejected", value: "REJECTED" },
];

/**
 * Risk level options for filtering
 */
const riskOptions: { label: string; value: RiskLevel }[] = [
  { label: "All Risk Levels", value: "LOW" as RiskLevel }, // This will be handled specially
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

/**
 * Filter header component with search and filter controls
 */
function FilterHeader({
  filters,
  setFilters,
  onRefresh,
}: {
  filters: ExecutionFilters;
  setFilters: (filters: Partial<ExecutionFilters>) => void;
  onRefresh: () => void;
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  return (
    <div className="space-y-4 p-6 border-b border-border">
      {/* Main search and actions row */}
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts, agents, or tasks..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick filter dropdowns */}
        <Select
          value={filters.timeRange || "24h"}
          onValueChange={(value) => setFilters({ timeRange: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          More Filters
        </Button>
      </div>

      {/* Expanded filters */}
      {showMoreFilters && (
        <div className="flex items-center space-x-4 pt-4 border-t border-border">
          <Select
            value={filters.status || ""}
            onValueChange={(value) =>
              setFilters({
                status:
                  value === "all" ? undefined : (value as ExecutionStatus),
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.slice(1).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.risk || ""}
            onValueChange={(value) =>
              setFilters({
                risk: value === "all" ? undefined : (value as RiskLevel),
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              {riskOptions.slice(1).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({
                search: "",
                status: undefined,
                risk: undefined,
                timeRange: "24h",
              })
            }
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Main execution explorer page component
 */
export function ExecutionExplorer() {
  const router = useRouter();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExecutionFilters>({
    timeRange: "24h",
  });

  // Fetch executions from API
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.executions.getExecutions();

      if (response.success && response.data) {
        setExecutions(response.data);
      } else {
        setError(response.error || "Failed to fetch executions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error fetching executions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search executions when search filter changes
  const searchExecutions = async (query: string) => {
    if (!query.trim()) {
      fetchExecutions();
      return;
    }

    try {
      setLoading(true);
      const response = await api.executions.searchExecutions(query);

      if (response.success && response.data) {
        setExecutions(response.data);
      } else {
        setError(response.error || "Failed to search executions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter executions locally based on current filters
  const filteredExecutions = executions.filter((execution) => {
    // Status filter
    if (filters.status && execution.status !== filters.status) {
      return false;
    }

    // Risk filter
    if (filters.risk && execution.overall_risk !== filters.risk) {
      return false;
    }

    // Time range filter (simplified - in production you'd filter by actual dates)
    // For now, we'll just show all executions

    return true;
  });

  // Handle navigation to execution detail page
  const handleExecutionClick = (executionId: string) => {
    router.push(`/explorer/${executionId}`);
  };

  // Update filters and trigger search if needed
  const updateFilters = (newFilters: Partial<ExecutionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // If search changed, perform search
    if ("search" in newFilters) {
      const searchQuery = newFilters.search || "";
      if (searchQuery.trim()) {
        searchExecutions(searchQuery);
      } else {
        fetchExecutions();
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchExecutions();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Executions
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchExecutions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Header */}
      <FilterHeader
        filters={filters}
        setFilters={updateFilters}
        onRefresh={fetchExecutions}
      />

      {/* Executions Grid */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No executions found
            </h3>
            <p className="text-sm text-muted-foreground">
              {filters.search
                ? "Try adjusting your search terms or filters."
                : "There are no executions to display."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExecutions.map((execution) => (
              <ExecutionCard
                key={execution._id}
                execution={execution}
                onClick={() => handleExecutionClick(execution.execution_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
