import AdminAnnouncementsPage from "@/app/admin/announcements";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/announcements")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminAnnouncementsPage />;
}
