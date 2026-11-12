import { RouterProvider } from "react-router";
import { AuthProvider } from "../lib/auth";
import { OngProvider } from "../lib/dados";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <OngProvider>
        <RouterProvider router={router} />
      </OngProvider>
    </AuthProvider>
  );
}
