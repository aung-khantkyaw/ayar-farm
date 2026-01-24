import ResourceApplicationsPage from "@/app/resources/applications";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resource/applications")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResourceApplicationsPage />;
}
