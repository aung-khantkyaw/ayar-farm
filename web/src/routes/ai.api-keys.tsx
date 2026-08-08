import ApiKeysPage from "@/app/ai/api-keys";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ai/api-keys')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ApiKeysPage />;
}
