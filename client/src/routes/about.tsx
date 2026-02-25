import { createFileRoute } from "@tanstack/react-router";
import AboutLayout from "../pages/AboutLayout";

export const Route = createFileRoute("/about")({
  component: AboutLayout,
});
