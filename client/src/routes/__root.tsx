import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Navbar from "../components/Navbar";
import NotFoundPage from "../pages/NotFound";

export const Route = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <div>
        <Outlet />
      </div>
      {import.meta.env.DEV && (
        <TanStackRouterDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </>
  ),
  notFoundComponent: NotFoundPage,
});
