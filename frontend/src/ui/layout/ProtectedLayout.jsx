import React from "react";
import { AnimatePresence } from "framer-motion";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { MotionBox } from "@ui/motionPrimitives";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "@context/AuthContext";
import LayoutContext from "@context/LayoutContext";
import { gradients, colors, spacing } from "@theme/tokens";

const MotionContainer = MotionBox;

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
    [layoutVariant, isFooterVisible],
  );

  if (isSessionLoading) {
    return (
      <Center minH="100vh" bg={colors.background.darkPrimary} color={colors.text.primary}>
        <VStack spacing={4} align="center">
          <Spinner size="lg" thickness="4px" color={colors.brand.primary} />
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
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        position="relative"
        bg={colors.background.darkPrimary}
      >
        <Box position="absolute" inset={0} bg={gradients.midnightMesh} opacity={0.55} />
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, rgba(5,5,5,0.95), rgba(5,5,5,0.8))"
        />

        <Box position="relative" zIndex={1}>
          <Header />
        </Box>

        <Box as="section" flex="1 0 auto" position="relative" zIndex={1} py={{ base: 8, md: 12 }}>
          {layoutVariant === "full" ? (
            <Box w="full" px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}>
              <Outlet />
            </Box>
          ) : (
            <AnimatePresence mode="wait">
              <MotionContainer
                key={location.pathname}
                maxW="6xl"
                mx="auto"
                px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}
                py={{ base: 8, md: 10 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <Outlet />
              </MotionContainer>
            </AnimatePresence>
          )}
        </Box>
        {isFooterVisible && (
          <Box position="relative" zIndex={1}>
            <Footer />
          </Box>
        )}
      </Box>
    </LayoutContext.Provider>
  );
}

export default ProtectedLayout;
