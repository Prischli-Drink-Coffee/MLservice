import React from "react";
import { Box, Container, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import LayoutContext from "../../context/LayoutContext";

const MotionContainer = motion(Container);

function ProtectedLayout() {
  const { isAuthenticated, isSessionLoading } = useAuth();
  const location = useLocation();
  const [layoutVariant, setLayoutVariant] = React.useState("container");
  const [isFooterVisible, setFooterVisible] = React.useState(true);

  React.useEffect(() => {
    setLayoutVariant("container");
    setFooterVisible(true);
  }, [location.pathname]);

  const layoutContextValue = React.useMemo(
    () => ({
      variant: layoutVariant,
      setVariant: setLayoutVariant,
      isFooterVisible,
      setFooterVisible,
    }),
    [layoutVariant, isFooterVisible]
  );

  if (isSessionLoading) {
    return (
      <Center minH="100vh" bg="gray.900" color="white">
        <VStack spacing={4} align="center">
          <Spinner size="lg" thickness="4px" color="white" />
          <Text fontSize="md" opacity={0.8}>
            Проверяем вашу сессию...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <Box minH="100vh" display="flex" flexDirection="column">
        <Header />
        {layoutVariant === "full" ? (
          <Box as="div" flex="1 0 auto" w="full" px={0} py={0}>
            <Outlet />
          </Box>
        ) : (
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
        {isFooterVisible && <Footer />}
      </Box>
    </LayoutContext.Provider>
  );
}

export default ProtectedLayout;
