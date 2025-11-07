import React from "react";
import { Box, Container } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const MotionContainer = motion(Container);

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if current route is graph builder or info page (needs full-screen)
  const isBuilderPage = location.pathname.includes("/builder");
  const isInfoPage = location.pathname.includes("/info");

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      {isBuilderPage || isInfoPage ? (
        // Builder and Info pages without container constraints
        <Box as={Container} maxW="full" flex="1 0 auto" py={0} px={0}>
          <Outlet />
        </Box>
      ) : (
        // Other pages with animations
        <AnimatePresence mode="wait">
          <MotionContainer
            key={location.pathname}
            maxW="6xl"
            flex="1 0 auto"
            py={6}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </MotionContainer>
        </AnimatePresence>
      )}
      {!isBuilderPage && !isInfoPage && <Footer />}
    </Box>
  );
}

export default ProtectedLayout;
