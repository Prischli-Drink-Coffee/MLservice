import React from "react";
import { AnimatePresence } from "framer-motion";
import { Box, Container } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { gradients, colors, spacing } from "@theme/tokens";

import { MotionBox, MotionVStack } from "@ui/motionPrimitives";
const MotionContainer = MotionBox; // MotionBox preserves motion behavior; Container animations use MotionBox wrapper

function PublicLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      position="relative"
      bg={colors.background.darkPrimary}
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0.75) 35%, rgba(5,5,5,0.95) 100%)"
        opacity={0.9}
      />

      <Box position="relative" zIndex={1}>
        <Header />
      </Box>

      <Box as="main" flex="1 0 auto" position="relative" zIndex={1}>
        <AnimatePresence mode="wait">
          {isHomePage ? (
            <MotionBox
              key={location.pathname}
              px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </MotionBox>
          ) : (
            <MotionContainer
              key={location.pathname}
              maxW="6xl"
              mx="auto"
              py={{ base: 10, md: 14 }}
              px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <Outlet />
            </MotionContainer>
          )}
        </AnimatePresence>
      </Box>

      <Box position="relative" zIndex={1}>
        <Footer />
      </Box>
    </Box>
  );
}

export default PublicLayout;
