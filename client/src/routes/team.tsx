import { createFileRoute } from '@tanstack/react-router'
import Team from '../pages/Team'

export const Route = createFileRoute('/team')({
  component: Team,
})
