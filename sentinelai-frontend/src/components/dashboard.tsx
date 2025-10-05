"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";

// Import our new dashboard components
import { KPICardsGrid } from "@/components/dashboard/kpi-cards";
import { RecentExecutions } from "@/components/dashboard/recent-executions";
import { RiskDistributionChart } from "@/components/dashboard/risk-distribution-chart";
import { SecurityLayerChart } from "@/components/dashboard/security-layer-chart";

// Import API functions
import { dashboardApi, executionsApi } from "@/lib/api";
import { DashboardStats, Execution } from "@/types";

/**
 * Custom hook to fetch dashboard data
 */
function useDashboardData() {
  // Fetch dashboard stats from Flask API
  const dashboardStatsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      console.log("Fetching dashboard stats...");
      const result = await dashboardApi.getStats();
      console.log("Dashboard stats query result:", result);
      return result;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });

  // Fetch recent executions
  const executionsQuery = useQuery({
    queryKey: ["executions"],
    queryFn: async () => {
      console.log("Fetching executions...");
      const result = await executionsApi.getExecutions();
      console.log("Executions query result:", result);
      return result;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });

  // Extract data with fallbacks
  const stats = dashboardStatsQuery.data?.data || null;
  const executions = executionsQuery.data?.data || null;

  console.log("Executions:", executions);

  console.log("Hook returning:", {
    stats,
    executions,
    isLoading: dashboardStatsQuery.isLoading || executionsQuery.isLoading,
  });

  return {
    stats,
    executions,
    isLoading: dashboardStatsQuery.isLoading || executionsQuery.isLoading,
    error: dashboardStatsQuery.error || executionsQuery.error,
    refetch: () => {
      dashboardStatsQuery.refetch();
      executionsQuery.refetch();
    },
  };
}

/**
 * Main dashboard page component
 * Displays overview of SentinelAI platform with KPIs, recent activity, and system health
 */
export default function DashboardPage() {
  const { stats, executions, isLoading, error, refetch } = useDashboardData();

  // Debug logging to understand what data we're receiving
  console.log("Dashboard Debug:", {
    stats,
    executions,
    isLoading,
    error: error?.message,
    statsType: typeof stats,
    statsKeys: stats ? Object.keys(stats) : "null",
  });

  const handleRefresh = () => {
    refetch();
    console.log("🔄 Dashboard data refreshed");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            {error ? "Using Mock Data" : "Live Data"}
          </Badge>
        </div>
      </div>

      {/* Error Message (if any) */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/10 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Unable to connect to SentinelAI API (localhost:9000). Showing
            mock data for demonstration purposes.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            To see real data: Start the SentinelAI backend server and ensure it
            has the endpoint <code>/api/dashboard/stats</code>
          </p>
        </div>
      )}

      {/* Debug Section - Show Raw API Response (uncomment for debugging) */}
      {/* {stats && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Raw API Response Debug</h3>
          <pre className="text-xs overflow-x-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )} */}

      {/* KPI Cards Grid */}
      <KPICardsGrid stats={stats} loading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Executions - spans 2 columns */}
        <RecentExecutions executions={executions} loading={isLoading} />

        {/* Risk Distribution Chart */}
        <RiskDistributionChart stats={stats} loading={isLoading} />
      </div>

      {/* Security Layer Effectiveness Chart */}
      <SecurityLayerChart stats={stats} loading={isLoading} />
    </div>
  );
}
