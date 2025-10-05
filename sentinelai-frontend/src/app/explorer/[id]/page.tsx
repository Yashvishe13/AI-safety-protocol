import { AppLayout } from "@/components/app-layout";
import { ExecutionDetail } from "@/components/explorer/execution-detail";

/**
 * Individual execution detail page
 * Displays detailed timeline and security analysis for a specific execution
 */
export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppLayout>
      <ExecutionDetail executionId={id} />
    </AppLayout>
  );
}
