import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes/router";
import CssBaseline from "@mui/material/CssBaseline";

const App = () => {
  return (
    <>
      <CssBaseline />
      <RouterProvider router={router} />
    </>
  );
};

export default App;
