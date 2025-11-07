import React, { Suspense, lazy } from "react";
import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { ReactFlowProvider } from "@xyflow/react";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import PublicLayout from "./components/layout/PublicLayout";

const GraphsPage = lazy(() => import("./pages/GraphsPage"));
const GraphDetailPage = lazy(() => import("./pages/GraphDetailPage"));
const GraphBuilderPage = lazy(() => import("./pages/GraphBuilderPage"));
const NodeRegistryPage = lazy(() => import("./pages/NodeRegistryPage"));
const TelegramPage = lazy(() => import("./pages/TelegramPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const HomePage = lazy(() => import("./pages/HomePage"));

const router = createHashRouter([
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
      { path: "graphs", element: <GraphsPage /> },
      { path: "graphs/:graphId", element: <GraphDetailPage /> },
      { path: "nodes", element: <NodeRegistryPage /> },
      {
        path: "builder",
        element: (
          <ReactFlowProvider>
            <GraphBuilderPage />
          </ReactFlowProvider>
        ),
      },
      {
        path: "builder/:graphId",
        element: (
          <ReactFlowProvider>
            <GraphBuilderPage />
          </ReactFlowProvider>
        ),
      },
      { path: "telegram", element: <TelegramPage /> },
      { path: "info", element: <InfoPage /> },
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
