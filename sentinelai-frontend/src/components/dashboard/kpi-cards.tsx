"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { DashboardStats } from "@/types";

/**
 * Props for individual KPI card
 */
interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

/**
 * Individual KPI Card component
 */
function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: KPICardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return null;
  };

  const getTrendColor = () => {
    if (variant === "destructive" && trend === "up") return "text-red-500";
    if (variant === "destructive" && trend === "down") return "text-green-500";
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          {TrendIcon && (
            <TrendIcon className={`h-3 w-3 mr-1 ${getTrendColor()}`} />
          )}
          {trendValue && <span className="mr-1">{trendValue}</span>}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Props for KPI Cards Grid component
 */
interface KPICardsGridProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

/**
 * Grid of 4 KPI cards showing key dashboard metrics
 */
export function KPICardsGrid({ stats, loading }: KPICardsGridProps) {
  // Debug logging to see what data we're receiving
  console.log("KPICardsGrid Debug:", {
    stats,
    loading,
    statsType: typeof stats,
    statsKeys: stats ? Object.keys(stats) : null,
    statsValues: stats ? Object.values(stats) : null,
  });

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>⚠️ Unable to connect to SentinelAI API</p>
              <p>Please check if the backend is running on port 9000</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate derived metrics - add extra safety checks
  const totalExecutions = stats?.total_executions ?? 0;
  const allowed = stats?.allowed ?? 0;
  const blocked = stats?.blocked ?? 0;
  const critical = stats?.critical ?? 0;

  const successRate =
    totalExecutions > 0
      ? ((allowed / totalExecutions) * 100).toFixed(1)
      : "0.0";

  // Calculate percentage change trends (mock values for now)
  const totalTrend = totalExecutions > 0 ? "+12%" : "0%";
  const successTrend = parseFloat(successRate) > 90 ? "+2.1%" : "-1.2%";
  const blockedTrend = blocked < totalExecutions * 0.1 ? "-15%" : "+8%";
  const criticalTrend = critical < totalExecutions * 0.05 ? "-25%" : "+10%";

  const kpiCards = [
    {
      title: "Total Executions",
      value: totalExecutions.toLocaleString(),
      description: `from previous period | Raw: ${totalExecutions}`,
      icon: Activity,
      trend: "up" as const,
      trendValue: totalTrend,
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: `${allowed}/${totalExecutions} allowed`,
      icon: CheckCircle,
      trend: parseFloat(successRate) > 90 ? ("up" as const) : ("down" as const),
      trendValue: successTrend,
    },
    {
      title: "Blocked Actions",
      value: blocked.toLocaleString(),
      description: `${((blocked / totalExecutions) * 100 || 0).toFixed(
        1
      )}% of total`,
      icon: Shield,
      trend:
        blocked < totalExecutions * 0.1 ? ("down" as const) : ("up" as const),
      trendValue: blockedTrend,
      variant:
        blocked < totalExecutions * 0.1
          ? ("success" as const)
          : ("warning" as const),
    },
    {
      title: "Critical Risks",
      value: critical.toLocaleString(),
      description: `${((critical / totalExecutions) * 100 || 0).toFixed(
        1
      )}% of total`,
      icon: AlertTriangle,
      trend:
        critical < totalExecutions * 0.05 ? ("down" as const) : ("up" as const),
      trendValue: criticalTrend,
      variant: "destructive" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((card, index) => (
        <KPICard
          key={index}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          trend={card.trend}
          trendValue={card.trendValue}
          variant={card.variant}
        />
      ))}
    </div>
  );
}
