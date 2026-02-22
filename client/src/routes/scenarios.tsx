import { createFileRoute } from '@tanstack/react-router'
import Scenarios from '../pages/Scenarios'

export const Route = createFileRoute('/scenarios')({
  component: Scenarios,
})
