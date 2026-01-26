import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

export const Route = createFileRoute('/account')({
  component: lazy(() => import('@/pages/account')),
})