import AIPlaygroundPage from '@/app/ai/ai-playground'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ai/ai-playground')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AIPlaygroundPage />
}
