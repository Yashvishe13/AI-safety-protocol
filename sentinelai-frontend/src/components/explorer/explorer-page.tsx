"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExecutionStatus, RiskLevel, Execution, Agent } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ExecutionList } from "./execution-list";
import { AgentDetails } from "./agent-details";

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
const statusOptions: { label: string; value: ExecutionStatus | "all" }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Rejected", value: "REJECTED" },
];

/**
 * Risk level options for filtering
 */
const riskOptions: { label: string; value: RiskLevel | "all" }[] = [
  { label: "All Risk Levels", value: "all" },
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

/**
 * Filter state interface
 */
interface FilterState {
  search: string;
  timeRange: string;
  status: ExecutionStatus | "all";
  risk: RiskLevel | "all";
}

/**
 * Filter header component with search and filter controls
 */
function FilterHeader({
  filters,
  setFilters,
  onRefresh,
}: {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
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
            placeholder="Search executions, agents, or tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick filter dropdowns */}
        <Select
          value={filters.timeRange}
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
            value={filters.status}
            onValueChange={(value) =>
              setFilters({ status: value as ExecutionStatus | "all" })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.risk}
            onValueChange={(value) =>
              setFilters({ risk: value as RiskLevel | "all" })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              {riskOptions.map((option) => (
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
                status: "all",
                risk: "all",
                timeRange: "24h",
              })
            }
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Main explorer page component - using original layout with execution data
 */
export function ExplorerPage() {
  // State management
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null
  );
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    timeRange: "24h",
    status: "all",
    risk: "all",
  });

  // Get selected execution object
  const selectedExecution =
    executions.find((exec) => exec.execution_id === selectedExecutionId) ||
    null;

  // Function to get visible agents (only up to first blocked agent)
  const getVisibleAgents = (agents: Agent[]): Agent[] => {
    const visibleAgents: Agent[] = [];

    for (const agent of agents) {
      visibleAgents.push(agent);

      // If this agent is blocked, stop here and don't show further agents
      if (agent.action === "blocked") {
        break;
      }
    }

    return visibleAgents;
  };

  // Get visible agents for the selected execution
  const visibleAgents = selectedExecution
    ? getVisibleAgents(selectedExecution.agents)
    : [];

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

  // Filter executions based on current filters
  const filteredExecutions = executions.filter((execution) => {
    // Search filter
    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      const matchesPrompt = execution.user_prompt
        .toLowerCase()
        .includes(searchQuery);
      const matchesAgent = execution.agents.some(
        (agent) =>
          agent.agent_name.toLowerCase().includes(searchQuery) ||
          agent.task.toLowerCase().includes(searchQuery)
      );
      if (!matchesPrompt && !matchesAgent) return false;
    }

    // Status filter
    if (filters.status !== "all" && execution.status !== filters.status) {
      return false;
    }

    // Risk filter
    if (filters.risk !== "all" && execution.overall_risk !== filters.risk) {
      return false;
    }

    return true;
  });

  // Handle execution selection
  const handleExecutionSelect = (executionId: string) => {
    setSelectedExecutionId(executionId);
    setSelectedAgent(null); // Reset to Prompt Security when changing execution
  };

  // Handle agent selection from timeline
  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Initial load
  useEffect(() => {
    fetchExecutions();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Execution Explorer
              </h1>
              <p className="text-muted-foreground">
                Monitor and analyze AI agent executions in real-time
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterHeader
        filters={filters}
        setFilters={updateFilters}
        onRefresh={fetchExecutions}
      />

      {/* Main Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Execution List + Agent Timeline */}
        <div className="w-2/5 border-r border-border flex flex-col">
          {/* Execution List Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>EXECUTIONS</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredExecutions.length} executions found
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ExecutionList
                executions={filteredExecutions}
                selectedExecutionId={selectedExecutionId}
                onExecutionSelect={handleExecutionSelect}
                loading={loading}
              />
            </div>
          </div>

          {/* Agent Timeline Section */}
          {selectedExecution && (
            <div className="flex-1 flex flex-col min-h-0 border-t border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>AGENTS</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {visibleAgents.length + 1} of{" "}
                  {selectedExecution.agents.length + 1} steps visible
                  {visibleAgents.length < selectedExecution.agents.length && (
                    <span className="text-red-600 ml-1">
                      (execution blocked)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-3">
                  {/* Prompt Security Step - Always shown first */}
                  <div
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedAgent === null
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedAgent(null)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        Prompt Security
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded",
                          selectedExecution.overall_action === "allowed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {selectedExecution.overall_action}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Initial security analysis of user prompt
                    </p>
                  </div>

                  {/* Existing Agents */}
                  {visibleAgents.map((agent, index) => (
                    <div
                      key={`${agent.agent_name}-${index}`}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedAgent === agent
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {agent.agent_name}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            agent.action === "allowed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {agent.action}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.task}
                      </p>
                    </div>
                  ))}

                  {/* Show blocked indicator if there are hidden agents */}
                  {visibleAgents.length < selectedExecution.agents.length && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700 font-medium">
                          Execution blocked -{" "}
                          {selectedExecution.agents.length -
                            visibleAgents.length}{" "}
                          subsequent agents hidden
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">DETAILS</h2>
            <p className="text-sm text-muted-foreground">
              {selectedAgent
                ? `${selectedAgent.agent_name} execution details`
                : selectedExecution
                ? "Prompt security analysis and execution details"
                : "Select an execution to view details"}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AgentDetails
              execution={selectedExecution}
              selectedAgent={selectedAgent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
