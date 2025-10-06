import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { StationsPage } from "./pages/StationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutPage } from "./pages/AboutPage";
import { TrendsPage } from "./pages/TrendsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "stations", element: <StationsPage /> },
      { path: "trends", element: <TrendsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "about", element: <AboutPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
