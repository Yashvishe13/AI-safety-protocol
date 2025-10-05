"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Filter,
  Check,
  X,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { mockSecurityAlerts } from "@/data/mock-data";
import { useAlertsStore } from "@/store";
import { SecurityAlert, RiskLevel } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Alert severity filter options
 */
const severityOptions: { value: RiskLevel | ""; label: string }[] = [
  { value: "", label: "All Severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

/**
 * Alert status filter options
 */
const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
];

/**
 * Filter header component
 */
function AlertsFilterHeader({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const { alertFilters, setAlertFilters } = useAlertsStore();
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleRefresh = () => {
    console.log("🔄 Refreshing alerts data...");
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
            placeholder="Search alerts by title, description, or agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick filter dropdowns */}
        <Select
          value={alertFilters.severity}
          onValueChange={(value) =>
            setAlertFilters({ severity: value as RiskLevel | "" })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            {severityOptions.map((option) => (
              <SelectItem
                key={option.value || "all"}
                value={option.value || "all"}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={alertFilters.status}
          onValueChange={(value) => setAlertFilters({ status: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
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

      {/* Bulk actions */}
      <BulkActions />
    </div>
  );
}

/**
 * Bulk actions component
 */
function BulkActions() {
  const { selectedAlertIds, clearSelection } = useAlertsStore();

  if (selectedAlertIds.length === 0) return null;

  const handleBulkAction = (action: string) => {
    console.log(`🔄 Bulk ${action} for alerts:`, selectedAlertIds);
    // In a real app, this would trigger API calls
    clearSelection();
  };

  return (
    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
      <span className="text-sm">
        {selectedAlertIds.length} alert{selectedAlertIds.length > 1 ? "s" : ""}{" "}
        selected
      </span>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction("acknowledge")}
        >
          <Check className="h-4 w-4 mr-1" />
          Acknowledge
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction("resolve")}
        >
          <Check className="h-4 w-4 mr-1" />
          Resolve
        </Button>
        <Button size="sm" variant="ghost" onClick={clearSelection}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}

/**
 * Individual alert item component
 */
interface AlertItemProps {
  alert: SecurityAlert;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function AlertItem({ alert, isSelected, onToggleSelect }: AlertItemProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case "OPEN":
        return "text-red-600 border-red-600";
      case "ACKNOWLEDGED":
        return "text-yellow-600 border-yellow-600";
      case "INVESTIGATING":
        return "text-blue-600 border-blue-600";
      case "RESOLVED":
        return "text-green-600 border-green-600";
      default:
        return "text-gray-600 border-gray-600";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />

          {/* Alert Icon */}
          <AlertTriangle
            className={cn(
              "h-5 w-5 mt-0.5",
              alert.severity === "CRITICAL"
                ? "text-red-500"
                : alert.severity === "HIGH"
                ? "text-orange-500"
                : alert.severity === "MEDIUM"
                ? "text-yellow-500"
                : "text-green-500"
            )}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm truncate">{alert.title}</h3>
              <div className="flex items-center space-x-2 ml-4">
                <Badge
                  className={cn("text-xs", getSeverityColor(alert.severity))}
                >
                  {alert.severity}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getStatusColor(alert.status))}
                >
                  {alert.status}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {alert.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                {alert.agent_name && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{alert.agent_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(alert.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {alert.assigned_to && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <span>Assigned to {alert.assigned_to}</span>
                  </div>
                )}
              </div>

              {alert.trace_id && (
                <Link href={`/explorer?trace=${alert.trace_id}`}>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    View Trace
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main alerts page component
 */
export function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { alertFilters, selectedAlertIds, toggleAlertSelection } =
    useAlertsStore();

  // Filter alerts based on current filter settings
  const filteredAlerts = useMemo(() => {
    let filtered = [...mockSecurityAlerts];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchLower) ||
          alert.description.toLowerCase().includes(searchLower) ||
          (alert.agent_name &&
            alert.agent_name.toLowerCase().includes(searchLower))
      );
    }

    // Severity filter
    if (alertFilters.severity) {
      filtered = filtered.filter(
        (alert) => alert.severity === alertFilters.severity
      );
    }

    // Status filter
    if (alertFilters.status && alertFilters.status !== "all") {
      filtered = filtered.filter(
        (alert) => alert.status === alertFilters.status
      );
    }

    // Sort by created date, newest first
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return filtered;
  }, [searchQuery, alertFilters]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Security Alerts</h1>
            <p className="text-muted-foreground">
              Monitor and manage security notifications and incidents
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {mockSecurityAlerts.filter((a) => a.status === "OPEN").length}
              </div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {
                  mockSecurityAlerts.filter((a) => a.severity === "CRITICAL")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <AlertsFilterHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Alert List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No alerts match your current filters
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search criteria or clearing filters
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredAlerts.length} of{" "}
                    {mockSecurityAlerts.length} alerts
                  </p>
                </div>

                {filteredAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedAlertIds.includes(alert.id)}
                    onToggleSelect={() => toggleAlertSelection(alert.id)}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
