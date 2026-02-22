import { createFileRoute } from '@tanstack/react-router'
import AboutWepp from '../pages/About_WEPP'

export const Route = createFileRoute('/about-wepp')({
  component: AboutWepp,
})
