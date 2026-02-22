import { createFileRoute } from '@tanstack/react-router'
import AboutRHESSys from '../pages/About_RHESSys'

export const Route = createFileRoute('/about-rhessys')({
  component: AboutRHESSys,
})
