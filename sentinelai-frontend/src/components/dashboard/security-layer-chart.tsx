"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { DashboardStats } from "@/types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Props for Security Layer Chart component
 */
interface SecurityLayerChartProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

/**
 * Get color for each security layer
 */
function getLayerColor(layer: string): string {
  switch (layer) {
    case "L1":
      return "#3b82f6"; // Blue
    case "L2":
      return "#8b5cf6"; // Purple
    case "L3":
      return "#06b6d4"; // Cyan
    case "LlamaGuard":
      return "#f59e0b"; // Amber
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Get background color with opacity for each layer
 */
function getLayerBackgroundColor(layer: string): string {
  switch (layer) {
    case "L1":
      return "rgba(59, 130, 246, 0.8)"; // Blue with opacity
    case "L2":
      return "rgba(139, 92, 246, 0.8)"; // Purple with opacity
    case "L3":
      return "rgba(6, 182, 212, 0.8)"; // Cyan with opacity
    case "LlamaGuard":
      return "rgba(245, 158, 11, 0.8)"; // Amber with opacity
    default:
      return "rgba(107, 114, 128, 0.8)"; // Gray with opacity
  }
}

/**
 * Security Layer Effectiveness Horizontal Bar Chart component
 */
export function SecurityLayerChart({
  stats,
  loading,
}: SecurityLayerChartProps) {
  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Security Layer Effectiveness</CardTitle>
          <CardDescription>Blocked threats by security layer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-6 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Security Layer Effectiveness</CardTitle>
          <CardDescription>Blocked threats by security layer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Unable to load security layer data
          </div>
        </CardContent>
      </Card>
    );
  }

  const layerData = stats.layer_effectiveness;
  const total = Object.values(layerData).reduce((sum, count) => sum + count, 0);

  // Prepare chart data for horizontal bar chart
  const chartData = {
    labels: Object.keys(layerData),
    datasets: [
      {
        label: "Blocks",
        data: Object.values(layerData),
        backgroundColor: Object.keys(layerData).map((layer) =>
          getLayerBackgroundColor(layer)
        ),
        borderColor: Object.keys(layerData).map((layer) =>
          getLayerColor(layer)
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    indexAxis: "y" as const, // Makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.x || 0;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${value} blocks (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: "normal" as const,
          },
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Security Layer Effectiveness</CardTitle>
        <CardDescription>Blocked threats by security layer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-[200px]">
            {total > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No blocking data available</p>
              </div>
            )}
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(layerData).map(([layer, count]) => {
              const percentage =
                total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
              const layerName =
                layer === "LlamaGuard"
                  ? "LlamaGuard"
                  : `${layer} ${getLayerName(layer)}`;

              return (
                <div
                  key={layer}
                  className="text-center p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getLayerColor(layer) }}
                    />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {layerName}
                  </p>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {percentage}% of total blocks
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total Blocked Actions:{" "}
              <span className="font-semibold">{total.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get human-readable layer name
 */
function getLayerName(layer: string): string {
  switch (layer) {
    case "L1":
      return "Firewall";
    case "L2":
      return "Backdoor";
    case "L3":
      return "Semantic";
    default:
      return "";
  }
}
