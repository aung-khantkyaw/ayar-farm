import ResourceLoansPage from "@/app/resources/loans";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resource/loans")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResourceLoansPage />;
}
