import { createFileRoute } from '@tanstack/react-router'
import AboutWATAR from '../pages/About_WATAR'

export const Route = createFileRoute('/about-watar')({
  component: AboutWATAR,
})
