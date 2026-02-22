import { createFileRoute } from '@tanstack/react-router'
import AboutSBS from '../pages/About_SBS'

export const Route = createFileRoute('/about-sbs')({
  component: AboutSBS,
})
