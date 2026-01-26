import ResourceArticlesPage from "@/app/resources/articles";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resource/articles")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResourceArticlesPage />;
}