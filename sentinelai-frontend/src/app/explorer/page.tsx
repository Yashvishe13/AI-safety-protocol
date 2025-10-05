import { AppLayout } from "@/components/app-layout";
import { ExplorerPage } from "@/components/explorer/explorer-page";

/**
 * Explorer route page component
 * Displays the trace exploration interface with filtering and detailed trace analysis
 */
export default function Explorer() {
  return (
    <AppLayout>
      <ExplorerPage />
    </AppLayout>
  );
}
