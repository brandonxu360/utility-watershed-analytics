import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import CssBaseline from "@mui/material/CssBaseline";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  return (
    <>
      <CssBaseline />
      <RouterProvider router={router} />
    </>
  );
};

export default App;
