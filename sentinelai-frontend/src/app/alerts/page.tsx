import { AppLayout } from "@/components/app-layout";
import { AlertsPage } from "@/components/alerts/alerts-page";

/**
 * Alerts route page component
 * Displays the security alerts management interface
 */
export default function Alerts() {
  return (
    <AppLayout>
      <AlertsPage />
    </AppLayout>
  );
}
