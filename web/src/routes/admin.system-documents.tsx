import SystemDocumentsPage from "@/app/admin/system-documents";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/system-documents")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SystemDocumentsPage />;
}