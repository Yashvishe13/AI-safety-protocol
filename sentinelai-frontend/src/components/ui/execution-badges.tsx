import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RiskLevel, ExecutionStatus, OverallAction } from "@/types";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  Shield,
  AlertOctagon,
} from "lucide-react";

/**
 * Props for RiskBadge component
 */
interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
}

/**
 * Badge component for displaying risk levels with appropriate colors
 */
export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const variants = {
    LOW: "bg-green-100 text-green-800 hover:bg-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    HIGH: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    CRITICAL: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const icons = {
    LOW: <Shield className="h-3 w-3" />,
    MEDIUM: <AlertTriangle className="h-3 w-3" />,
    HIGH: <AlertOctagon className="h-3 w-3" />,
    CRITICAL: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="secondary"
      className={cn(variants[risk], "text-xs font-medium", className)}
    >
      {icons[risk]}
      <span className="ml-1">{risk}</span>
    </Badge>
  );
}

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  status: ExecutionStatus;
  className?: string;
}

/**
 * Badge component for displaying execution status with appropriate colors and icons
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    COMPLETED: "bg-green-100 text-green-800 hover:bg-green-200",
    BLOCKED: "bg-red-100 text-red-800 hover:bg-red-200",
    PROCESSING: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const icons = {
    COMPLETED: <CheckCircle className="h-3 w-3" />,
    BLOCKED: <AlertTriangle className="h-3 w-3" />,
    PROCESSING: <Loader2 className="h-3 w-3 animate-spin" />,
    REJECTED: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="secondary"
      className={cn(variants[status], "text-xs font-medium", className)}
    >
      {icons[status]}
      <span className="ml-1">{status}</span>
    </Badge>
  );
}

/**
 * Props for ActionBadge component
 */
interface ActionBadgeProps {
  action: OverallAction;
  className?: string;
}

/**
 * Badge component for displaying action decisions
 */
export function ActionBadge({ action, className }: ActionBadgeProps) {
  const variants = {
    allowed: "bg-green-100 text-green-800 hover:bg-green-200",
    blocked: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const icons = {
    allowed: <CheckCircle className="h-3 w-3" />,
    blocked: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        variants[action],
        "text-xs font-medium capitalize",
        className
      )}
    >
      {icons[action]}
      <span className="ml-1">{action}</span>
    </Badge>
  );
}
