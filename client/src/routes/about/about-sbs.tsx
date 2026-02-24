import { createFileRoute } from '@tanstack/react-router'
import AboutSBS from '../../pages/About_SBS'

export const Route = createFileRoute('/about/about-sbs')({
  component: AboutSBS,
})
