import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import PublicLayout from "./components/layout/PublicLayout";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const DatasetsPage = lazy(() => import("./pages/DatasetsPage"));
const TrainingRunsPage = lazy(() => import("./pages/TrainingRunsPage"));
const ArtifactsPage = lazy(() => import("./pages/ArtifactsPage"));
const MetricsPage = lazy(() => import("./pages/MetricsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <SignUpPage /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { path: "datasets", element: <DatasetsPage /> },
      { path: "training", element: <TrainingRunsPage /> },
      { path: "artifacts", element: <ArtifactsPage /> },
      { path: "metrics", element: <MetricsPage /> },
      { path: "info", element: <InfoPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

function App() {
  return (
    <Suspense
      fallback={
        <Center h="100vh">
          <Spinner size="lg" />
        </Center>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
