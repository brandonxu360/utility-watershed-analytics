import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import Navbar from "../components/Navbar";

export const Route = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <div>
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools initialIsOpen={false} />}
    </>
  ),
  notFoundComponent: () => <div>404: Page Not Found</div>,
});
