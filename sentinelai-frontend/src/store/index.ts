import { create } from 'zustand';
import { TraceListItem, FilterOptions, RiskLevel } from '@/types';

/**
 * Explorer store state interface
 * Manages the state for the trace explorer page including filters and selections
 */
interface ExplorerState {
  // Selected trace management
  /** Currently selected trace ID for viewing details */
  selectedTraceId: string | null;
  /** Set the selected trace ID */
  setSelectedTraceId: (id: string | null) => void;

  // Filter management
  /** Current filter values */
  filters: FilterOptions;
  /** Update filter values (partial updates supported) */
  setFilters: (filters: Partial<FilterOptions>) => void;
  /** Reset all filters to default values */
  resetFilters: () => void;

  // UI state management
  /** Whether the detail panel is open (for mobile responsive) */
  isDetailPanelOpen: boolean;
  /** Set detail panel open state */
  setDetailPanelOpen: (open: boolean) => void;

  // Loading states
  /** Whether traces are currently being loaded */
  isLoadingTraces: boolean;
  /** Set loading state for traces */
  setLoadingTraces: (loading: boolean) => void;

  // Cached trace data (for performance)
  /** Cached trace list */
  cachedTraces: TraceListItem[];
  /** Set cached traces */
  setCachedTraces: (traces: TraceListItem[]) => void;
}

/**
 * Default filter values
 */
const defaultFilters: FilterOptions = {
  search: '',
  agent: '',
  status: undefined,
  risk: undefined,
  timeRange: '24h',
};

/**
 * Explorer store using Zustand
 * Provides centralized state management for the trace explorer interface
 */
export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // Initial state
  selectedTraceId: null,
  filters: defaultFilters,
  isDetailPanelOpen: false,
  isLoadingTraces: false,
  cachedTraces: [],

  // Actions
  setSelectedTraceId: (id) => {
    set({ selectedTraceId: id });
    // Auto-open detail panel when trace is selected (useful for mobile)
    if (id && !get().isDetailPanelOpen) {
      set({ isDetailPanelOpen: true });
    }
  },

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: defaultFilters, selectedTraceId: null }),

  setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),

  setLoadingTraces: (loading) => set({ isLoadingTraces: loading }),

  setCachedTraces: (traces) => set({ cachedTraces: traces }),
}));

/**
 * Dashboard store state interface
 * Manages dashboard-specific state and metrics
 */
interface DashboardState {
  /** Last refresh timestamp */
  lastRefresh: Date | null;
  /** Set last refresh timestamp */
  setLastRefresh: (date: Date) => void;

  /** Whether dashboard is in compact view */
  isCompactView: boolean;
  /** Toggle compact view */
  toggleCompactView: () => void;
}

/**
 * Dashboard store using Zustand
 * Manages dashboard-specific UI state and preferences
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  lastRefresh: null,
  isCompactView: false,

  setLastRefresh: (date) => set({ lastRefresh: date }),

  toggleCompactView: () =>
    set((state) => ({ isCompactView: !state.isCompactView })),
}));

/**
 * Alerts store state interface
 * Manages security alerts state and filtering
 */
interface AlertsState {
  /** Selected alert IDs for bulk operations */
  selectedAlertIds: string[];
  /** Set selected alert IDs */
  setSelectedAlertIds: (ids: string[]) => void;

  /** Add/remove alert ID from selection */
  toggleAlertSelection: (id: string) => void;

  /** Clear all selections */
  clearSelection: () => void;

  /** Alert filter options */
  alertFilters: {
    severity: RiskLevel | '';
    status: string;
    timeRange: string;
  };

  /** Update alert filters */
  setAlertFilters: (filters: Partial<AlertsState['alertFilters']>) => void;
}

/**
 * Alerts store using Zustand
 * Manages security alerts interface state
 */
export const useAlertsStore = create<AlertsState>((set) => ({
  selectedAlertIds: [],
  alertFilters: {
    severity: '',
    status: 'all',
    timeRange: '7d',
  },

  setSelectedAlertIds: (ids) => set({ selectedAlertIds: ids }),

  toggleAlertSelection: (id) =>
    set((state) => ({
      selectedAlertIds: state.selectedAlertIds.includes(id)
        ? state.selectedAlertIds.filter(alertId => alertId !== id)
        : [...state.selectedAlertIds, id],
    })),

  clearSelection: () => set({ selectedAlertIds: [] }),

  setAlertFilters: (newFilters) =>
    set((state) => ({
      alertFilters: { ...state.alertFilters, ...newFilters },
    })),
}));

/**
 * Global app store for cross-component state
 */
interface AppState {
  /** Current active navigation item */
  currentPage: 'dashboard' | 'explorer' | 'alerts';
  /** Set current page */
  setCurrentPage: (page: AppState['currentPage']) => void;

  /** Global loading state */
  isGlobalLoading: boolean;
  /** Set global loading state */
  setGlobalLoading: (loading: boolean) => void;

  /** Sidebar collapsed state */
  isSidebarCollapsed: boolean;
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
}

/**
 * Global app store
 * Manages application-wide state like navigation and global UI states
 */
export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  isGlobalLoading: false,
  isSidebarCollapsed: false,

  setCurrentPage: (page) => set({ currentPage: page }),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
