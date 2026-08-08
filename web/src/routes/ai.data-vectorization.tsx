import DataVectorizationPage from "@/app/ai/data-vectorization";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ai/data-vectorization')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DataVectorizationPage />;
}
