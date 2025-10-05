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
import {
  ExecutionStatus,
  RiskLevel,
  Execution,
  Agent,
  TraceStatus,
} from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ExecutionList } from "./execution-list";
import { AgentDetails } from "./agent-details";
import { AgentTimeline } from "../ui/agent-timeline";
import { TraceList } from "./trace-list";
import { TraceDetails } from "./trace-details";
import { useExplorerStore } from "@/store";
import {
  agentTypes,
  mockTraceList,
  riskLevelOptions,
  statusOptions,
  timeRangeOptions,
} from "@/data/mock-data";

/**
 * Filter header component with search and filter controls
 */
function FilterHeader() {
  const { filters, setFilters, resetFilters } = useExplorerStore();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleRefresh = () => {
    console.log("🔄 Refreshing trace data...");
    // In a real app, this would trigger React Query refetch
  };

  return (
    <div className="space-y-4 p-6 border-b border-border">
      {/* Main search and actions row */}
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search traces, agents, or tasks..."
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
        <Button variant="outline" size="sm" onClick={handleRefresh}>
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
            value={filters.agent || ""}
            onValueChange={(value) =>
              setFilters({ agent: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agentTypes.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || ""}
            onValueChange={(value) =>
              setFilters({
                status: value === "all" ? undefined : (value as TraceStatus),
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((option) => (
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              {riskLevelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Main explorer page component with split-panel interface
 * Left panel: Trace list with filtering
 * Right panel: Selected trace details
 */
export function ExplorerPage() {
  const { selectedTraceId, isDetailPanelOpen } = useExplorerStore();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trace Explorer</h1>
            <p className="text-muted-foreground">
              Investigate agent executions and security analysis
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterHeader />

      {/* Main Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Trace List */}
        <div
          className={cn(
            "w-2/5 border-r border-border flex flex-col",
            isDetailPanelOpen && "lg:w-2/5"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">TRACE LIST</h2>
            <p className="text-sm text-muted-foreground">
              {mockTraceList.length} traces found
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            {/* <TraceList /> */}
            <div className="p-4 text-muted-foreground">
              TraceList component placeholder
            </div>
          </div>
        </div>

        {/* Right Panel - Trace Details */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">EXECUTION DETAILS</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTraceId
                ? "Detailed trace analysis"
                : "Select a trace to view details"}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            {/* <TraceDetails /> */}
            <div className="p-4 text-muted-foreground">
              TraceDetails component placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
