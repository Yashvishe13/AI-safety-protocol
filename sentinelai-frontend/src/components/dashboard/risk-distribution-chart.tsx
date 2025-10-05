"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { DashboardStats, RiskLevel } from "@/types";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Props for Risk Distribution Chart component
 */
interface RiskDistributionChartProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

/**
 * Get color for each risk level
 */
function getRiskLevelColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "LOW":
      return "#22c55e"; // Green
    case "MEDIUM":
      return "#eab308"; // Yellow
    case "HIGH":
      return "#f97316"; // Orange
    case "CRITICAL":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Risk Distribution Donut Chart component
 */
export function RiskDistributionChart({
  stats,
  loading,
}: RiskDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Security risk levels across executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Security risk levels across executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Unable to load risk distribution data
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskData = stats.risk_distribution;
  const total = Object.values(riskData).reduce((sum, count) => sum + count, 0);

  // Prepare chart data
  const chartData = {
    labels: Object.keys(riskData),
    datasets: [
      {
        data: Object.values(riskData),
        backgroundColor: Object.keys(riskData).map((level) =>
          getRiskLevelColor(level as RiskLevel)
        ),
        borderColor: Object.keys(riskData).map((level) =>
          getRiskLevelColor(level as RiskLevel)
        ),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create our own legend
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "60%", // Makes it a doughnut instead of pie
    elements: {
      arc: {
        borderRadius: 4,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
        <CardDescription>
          Security risk levels across executions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Chart */}
          <div className="h-[250px] flex items-center justify-center">
            {total > 0 ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No execution data available</p>
              </div>
            )}
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(riskData).map(([level, count]) => {
              const percentage =
                total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={level}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getRiskLevelColor(level as RiskLevel),
                      }}
                    />
                    <span className="text-sm font-medium">{level}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total Executions:{" "}
              <span className="font-semibold">{total.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
