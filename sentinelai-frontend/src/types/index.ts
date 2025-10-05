/**
 * Core data types for SentinelAI platform
 * Defines interfaces for traces, security analysis, and system monitoring
 */

/**
 * Risk levels for security assessment
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Execution status of agent traces
 */
export type TraceStatus = 'COMPLETED' | 'BLOCKED' | 'PENDING' | 'PROCESSING' | 'FAILED';

/**
 * Execution status from the Flask API
 */
export type ExecutionStatus = 'PROCESSING' | 'COMPLETED' | 'BLOCKED' | 'REJECTED';

/**
 * Overall action decision
 */
export type OverallAction = 'allowed' | 'blocked';

/**
 * Blocked by levels
 */
export type BlockedBy = 'L1' | 'L2' | 'L3' | 'llama_guard';

/**
 * Security firewall results
 */
export type FirewallResult = 'SAFE' | 'BLOCKED' | 'SANITIZED';

/**
 * Action decisions from guardrails
 */
export type ActionDecision = 'ALLOW' | 'BLOCK' | 'PENDING';

/**
 * Trace list item for the explorer interface
 * Contains essential information for trace listing and filtering
 */
export interface TraceListItem {
  /** Unique identifier for the trace */
  id: string;
  /** Name of the AI agent (e.g., "TransactionGuard", "MarketTrend") */
  agent: string;
  /** Description of the task being performed */
  task: string;
  /** Summary of the agent's output */
  output: string;
  /** Risk score from 0-100 */
  risk_score: number;
  /** Categorized risk level */
  risk_level: RiskLevel;
  /** Current execution status */
  status: TraceStatus;
  /** ISO timestamp of trace creation */
  timestamp: string;
  /** Execution duration in seconds */
  duration: number;
  /** User who initiated the trace */
  user_id: string;
  /** Session identifier */
  session_id: string;
}

/**
 * User context information for a trace
 */
export interface UserContext {
  /** User who initiated the trace */
  user_id: string;
  /** Session identifier */
  session_id: string;
  /** Original user prompt or request */
  original_prompt: string;
}

/**
 * L1 Firewall security analysis results
 */
export interface L1Firewall {
  /** Overall security assessment result */
  result: FirewallResult;
  /** Confidence level in the assessment (0-100) */
  confidence: number;
  /** Time taken for security scan in milliseconds */
  scan_duration: number;
  /** Security patterns that were checked */
  patterns_checked: string[];
  /** List of threats that were detected */
  threats_detected: string[];
}

/**
 * Individual action evaluated by L2 guardrails
 */
export interface GuardrailAction {
  /** Type of action (e.g., "api_call", "file_access", "database_query") */
  type: string;
  /** Human-readable description of the action */
  description: string;
  /** Risk score for this specific action (0-100) */
  risk_score: number;
  /** Decision made by the guardrail */
  decision: ActionDecision;
  /** Explanation for the decision */
  reasoning: string;
}

/**
 * L2 Guardrail analysis results
 */
export interface L2Guardrail {
  /** Total number of actions evaluated */
  actions_evaluated: number;
  /** Number of actions that were allowed */
  actions_allowed: number;
  /** Number of actions that were blocked */
  actions_blocked: number;
  /** Detailed list of all evaluated actions */
  actions: GuardrailAction[];
}

/**
 * Performance metrics for L3 debugging
 */
export interface PerformanceMetrics {
  /** CPU usage percentage */
  cpu_usage: string;
  /** Memory usage in MB */
  memory_usage: string;
  /** Number of API calls made */
  api_calls: number;
}

/**
 * L3 Debug information
 */
export interface L3Debug {
  /** Total number of debug events logged */
  total_events: number;
  /** Execution path through the agent system */
  execution_path: string[];
  /** Performance metrics during execution */
  performance_metrics: PerformanceMetrics;
  /** Error messages encountered */
  errors: string[];
  /** Warning messages generated */
  warnings: string[];
}

/**
 * Complete trace details with full security analysis
 * Extends TraceListItem with comprehensive security and debug information
 */
export interface TraceDetails extends TraceListItem {
  /** User and session context information */
  user_context: UserContext;
  /** L1 firewall security analysis */
  l1_firewall: L1Firewall;
  /** L2 guardrail action analysis */
  l2_guardrail: L2Guardrail;
  /** L3 debug and performance information */
  l3_debug: L3Debug;
  /** Raw execution logs */
  raw_logs: string[];
}

/**
 * Filter options for trace exploration
 */
export interface FilterOptions {
  /** Search query string */
  search?: string;
  /** Filter by agent type */
  agent?: string;
  /** Filter by execution status */
  status?: TraceStatus;
  /** Filter by risk level */
  risk?: RiskLevel;
  /** Time range filter */
  timeRange?: string;
}

/**
 * Dashboard KPI metrics (legacy - keeping for compatibility)
 */
export interface DashboardMetrics {
  /** Total number of traces processed */
  total_traces: number;
  /** Number of blocked actions */
  blocked_actions: number;
  /** Distribution of traces by risk level */
  risk_distribution: Record<RiskLevel, number>;
  /** Average processing time in seconds */
  avg_processing_time: number;
  /** System uptime percentage */
  system_uptime: number;
}

/**
 * Dashboard statistics from Flask API
 */
export interface DashboardStats {
  /** Total number of executions */
  total_executions: number;
  /** Number of blocked executions */
  blocked: number;
  /** Number of allowed executions */
  allowed: number;
  /** Number of critical risk executions */
  critical: number;
  /** Distribution of executions by risk level */
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  /** Security layer effectiveness statistics */
  layer_effectiveness: {
    L1: number;
    L2: number;
    L3: number;
    LlamaGuard: number;
  };
}

/**
 * Security alert information
 */
export interface SecurityAlert {
  /** Unique alert identifier */
  id: string;
  /** Alert title */
  title: string;
  /** Detailed alert description */
  description: string;
  /** Alert severity level */
  severity: RiskLevel;
  /** Alert status */
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'INVESTIGATING';
  /** Associated trace ID if applicable */
  trace_id?: string;
  /** Affected agent name */
  agent_name?: string;
  /** Timestamp when alert was created */
  created_at: string;
  /** Timestamp when alert was last updated */
  updated_at: string;
  /** User assigned to handle the alert */
  assigned_to?: string;
}

/**
 * Security check result for each layer (L1, L2, L3, llama_guard)
 */
export interface SecurityResult {
  /** L1 firewall check result */
  L1: {
    flagged: boolean;
    reason: string;
    category: string;
  };
  /** Llama Guard check result */
  llama_guard: {
    flagged: boolean;
    reason: string;
    category: string;
  };
  /** L2 guardrail check result */
  L2: {
    flagged: boolean;
    reason: string;
    category: string;
  };
  /** L3 compliance check result */
  L3: {
    flagged: boolean;
    reason: string;
    category: string;
  };
}

/**
 * Agent execution information
 */
export interface Agent {
  /** Name of the agent */
  agent_name: string;
  /** Task description */
  task: string;
  /** Agent output data */
  output: Record<string, unknown>;
  /** Execution timestamp */
  timestamp: string;
  /** Security check results for this agent */
  sentinel_result: SecurityResult;
  /** Action decision (allowed/blocked) */
  action: OverallAction;
}

/**
 * Complete execution information from Flask API
 */
export interface Execution {
  /** MongoDB document ID */
  _id: string;
  /** Unique execution identifier */
  execution_id: string;
  /** Original user prompt */
  user_prompt: string;
  /** Current execution status */
  status: ExecutionStatus;
  /** Overall risk assessment */
  overall_risk: RiskLevel;
  /** Final action decision */
  overall_action: OverallAction;
  /** Which layer blocked the execution (if blocked) */
  blocked_by?: BlockedBy;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** List of agents involved in execution */
  agents: Agent[];
  /** Prompt-level security check results */
  prompt_security: SecurityResult;
}

/**
 * Case creation response
 */
export interface Case {
  /** Case ID */
  id: string;
  /** Trace ID this case is associated with */
  traceId: string;
  /** Case status */
  status: string;
  /** Created timestamp */
  createdAt: string;
}

/**
 * Alert operation response
 */
export interface AlertOperationResponse {
  /** Operation success status */
  success: boolean;
  /** Number of affected alerts */
  affected: number;
  /** Operation message */
  message: string;
}

/**
 * Generic API response wrapper
 * Provides consistent interface for all API responses
 */
export interface ApiResponse<T> {
  /** Response data */
  data?: T;
  /** Error message if request failed */
  error?: string;
  /** HTTP status code */
  status: number;
  /** Success indicator */
  success: boolean;
}
