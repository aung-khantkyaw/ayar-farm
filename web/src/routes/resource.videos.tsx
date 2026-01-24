import ResourceVideosPage from "@/app/resources/videos";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resource/videos")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResourceVideosPage />;
}
