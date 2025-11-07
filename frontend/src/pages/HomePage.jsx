import React from "react";
import { Box, Container, SimpleGrid } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import useHealth from "../hooks/useHealth";
import HeroSection from "../components/home/HeroSection";
import PlatformInfoCard from "../components/home/PlatformInfoCard";
import BenefitsSection from "../components/home/BenefitsSection";
import FeatureSlider from "../components/home/FeatureSlider";
import SectionDivider from "../components/common/SectionDivider";
import { colors } from "../theme/tokens";

/**
 * HomePage - Redesigned landing page with design system
 */
function HomePage() {
  const { isAuthenticated } = useAuth();
  const health = useHealth(12000);

  return (
    <Box as="main" bg={colors.background.darkPrimary} w="full" minH="100vh">
      {/* Hero Section with Two-Column Layout */}
      <Box pt={{ base: 10, md: 16 }} pb={{ base: 12, md: 18 }} px={{ base: 4, md: 6, lg: 8 }}>
        <Container maxW="1400px" px={0}>
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            spacing={{ base: 6, md: 8, lg: 12 }}
            alignItems="start"
          >
            {/* Left: Hero with Title & CTAs */}
            <HeroSection isAuthenticated={isAuthenticated} />

            {/* Right: Platform Info Card */}
            <PlatformInfoCard isAuthenticated={isAuthenticated} health={health} />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Decorative Divider 1 */}
      <Container maxW="1400px" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="electric" />
      </Container>

      {/* Benefits Section */}
      <Box
        py={{ base: 12, md: 16 }}
        px={{ base: 4, md: 6, lg: 8 }}
        bg={`linear-gradient(180deg, ${colors.background.darkPrimary} 0%, ${colors.blur.light} 50%, ${colors.background.darkPrimary} 100%)`}
      >
        <Container maxW="1400px" px={0}>
          <BenefitsSection />
        </Container>
      </Box>

      {/* Decorative Divider 2 - Lightning */}
      <Container maxW="1400px" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="lightning" />
      </Container>

      {/* Feature Slider Section */}
      <Box
        py={{ base: 14, md: 18 }}
        px={{ base: 4, md: 6, lg: 8 }}
        bg={colors.background.darkPrimary}
        overflow="hidden"
      >
        <Container maxW="1400px" px={0}>
          <FeatureSlider />
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;
