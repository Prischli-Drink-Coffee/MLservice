import React from "react";
import { Box, Container } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { AnimatePresence, motion } from "framer-motion";

const MotionBox = motion(Box);
const MotionContainer = motion(Container);

function PublicLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <AnimatePresence mode="wait">
        {isHomePage ? (
          <MotionBox
            key={location.pathname}
            flex="1 0 auto"
            w="full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </MotionBox>
        ) : (
          <MotionContainer
            key={location.pathname}
            maxW="lg"
            flex="1 0 auto"
            py={10}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </MotionContainer>
        )}
      </AnimatePresence>
      <Footer />
    </Box>
  );
}

export default PublicLayout;
