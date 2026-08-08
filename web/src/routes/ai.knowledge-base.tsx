import KnowledgeBasePage from "@/app/ai/knowledge-base";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ai/knowledge-base')({
  component: RouteComponent,
})

function RouteComponent() {
  return <KnowledgeBasePage />;
}
