# Dashboard Components

## Overview

The SentinelAI Dashboard provides real-time monitoring and analytics for your AI agent security platform. The dashboard displays key performance indicators, recent execution activity, risk analysis, and security layer effectiveness.

## Features

### 📊 Real-time KPI Cards

- **Total Executions**: Shows total number of AI agent executions with trend indicators
- **Success Rate**: Displays percentage of allowed vs blocked executions
- **Blocked Actions**: Number of security threats prevented
- **Critical Risks**: Count of high-priority security events

### 📈 Recent Executions

- List of the most recent AI agent executions
- Risk level badges (LOW, MEDIUM, HIGH, CRITICAL) with color coding
- Clickable items that navigate to detailed execution views
- Real-time timestamps showing when executions occurred

### 🎯 Risk Distribution Chart

- Interactive donut chart showing risk level breakdown
- Visual representation of security risk distribution
- Hover tooltips with detailed percentages
- Custom legend with counts and percentages

### 🛡️ Security Layer Effectiveness

- Horizontal bar chart showing blocked threats by layer
- L1 Firewall, L2 Backdoor, L3 Semantic, and LlamaGuard statistics
- Percentage breakdown of each layer's contribution
- Visual comparison of layer performance

## API Integration

### Flask Backend

The dashboard connects to your Flask API running on `http://localhost:9000` with these endpoints:

- `GET /api/executions` - Retrieves execution data
- `GET /api/dashboard/stats` - Gets dashboard statistics

### Data Structure

```typescript
interface DashboardStats {
  total_executions: number;
  blocked: number;
  allowed: number;
  critical: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  layer_effectiveness: {
    L1: number;
    L2: number;
    L3: number;
    LlamaGuard: number;
  };
}
```

## Components

### File Structure

```
src/components/dashboard/
├── kpi-cards.tsx           # KPI metrics grid
├── recent-executions.tsx   # Recent activity list
├── risk-distribution-chart.tsx # Risk level donut chart
└── security-layer-chart.tsx    # Layer effectiveness bars
```

### Usage

```tsx
import { KPICardsGrid } from "@/components/dashboard/kpi-cards";
import { RecentExecutions } from "@/components/dashboard/recent-executions";
import { RiskDistributionChart } from "@/components/dashboard/risk-distribution-chart";
import { SecurityLayerChart } from "@/components/dashboard/security-layer-chart";

// In your component
<KPICardsGrid stats={stats} loading={isLoading} />
<RecentExecutions executions={executions} loading={isLoading} />
<RiskDistributionChart stats={stats} loading={isLoading} />
<SecurityLayerChart stats={stats} loading={isLoading} />
```

## Responsive Design

The dashboard is fully responsive and adapts to different screen sizes:

- **Desktop**: 4-column KPI grid, 3-column main content
- **Tablet**: 2-column KPI grid, responsive charts
- **Mobile**: Single column layout with stacked components

## Real-time Updates

The dashboard automatically refreshes data every 30 seconds and includes:

- Manual refresh button in the header
- Loading states for all components
- Error handling with fallback to mock data
- Visual indicators for data source (Live Data vs Mock Data)

## Error Handling

When the Flask API is unavailable:

- Displays warning message about using mock data
- Gracefully falls back to mock data for development
- Maintains full functionality for testing and development
- Shows "Using Mock Data" badge in header

## Customization

### Colors

Risk levels use consistent color coding:

- 🟢 **LOW**: Green (`#22c55e`)
- 🟡 **MEDIUM**: Yellow (`#eab308`)
- 🟠 **HIGH**: Orange (`#f97316`)
- 🔴 **CRITICAL**: Red (`#ef4444`)

### Charts

Built with Chart.js for:

- High performance rendering
- Interactive tooltips
- Responsive design
- Customizable styling

## Development

### Running Locally

```bash
# Start the development server
pnpm dev

# Dashboard will be available at:
# http://localhost:3000 (or next available port)
```

### Testing with Mock Data

The dashboard includes comprehensive mock data for development when the Flask API is not available.

### Adding New Metrics

To add new KPI cards or charts:

1. Update the `DashboardStats` interface in `src/types/index.ts`
2. Add the new component to the appropriate dashboard file
3. Update the API client if needed
4. Test with both live and mock data
