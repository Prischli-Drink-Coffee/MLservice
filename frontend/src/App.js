import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import ProtectedLayout from "./ui/layout/ProtectedLayout";
import PublicLayout from "./ui/layout/PublicLayout";

const LoginPage = lazy(() => import("@pages/login"));
const SignUpPage = lazy(() => import("@pages/signup"));
const NotFoundPage = lazy(() => import("@pages/notFound"));
const InfoPage = lazy(() => import("@pages/info"));
const HomePage = lazy(() => import("@pages/home"));
const DatasetsPage = lazy(() => import("@pages/datasets"));
const TrainingRunsPage = lazy(() => import("@pages/training"));
const ArtifactsPage = lazy(() => import("@pages/artifacts"));
const MetricsPage = lazy(() => import("@pages/metrics"));
const ProfilePage = lazy(() => import("@pages/profile"));
const DocumentsPage = lazy(() => import("@features/documents/DocumentsPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "documents", element: <DocumentsPage /> },
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
