import ResourceAgrometBulletinsPage from "@/app/resources/agromet-bulletins";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resource/agromet-bulletins")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResourceAgrometBulletinsPage />;
}