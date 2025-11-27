import React from "react";
import { Box } from "@chakra-ui/react";
import { colors } from "@theme/tokens";
import useHomePageController from "@features/home/useHomePageController";
import HomeHeroSection from "@features/home/components/HomeHeroSection";
import HomeDivider from "@features/home/components/HomeDivider";
import HomeMetricsSection from "@features/home/components/HomeMetricsSection";
import HomeBenefitsSection from "@features/home/components/HomeBenefitsSection";
import HomeFeatureSliderSection from "@features/home/components/HomeFeatureSliderSection";
import { useLayoutControls } from "@context/LayoutContext";

/**
 * HomePage - Redesigned landing page with design system
 */
function HomePage() {
  const { isAuthenticated, health, layout } = useHomePageController();
  const { setVariant } = useLayoutControls();

  React.useEffect(() => {
    setVariant("full");
    return () => setVariant("container");
  }, [setVariant]);

  return (
    <Box w="full" minH="100vh" bg="transparent">
      <Box {...layout.sections.hero}>
        <HomeHeroSection
          isAuthenticated={isAuthenticated}
          health={health}
          gridProps={layout.hero.gridProps}
          containerProps={layout.containers.hero}
        />
      </Box>

      <HomeDivider variant="electric" containerProps={layout.containers.divider} />

      <HomeMetricsSection
        isAuthenticated={isAuthenticated}
        sectionProps={layout.sections.metrics}
        containerProps={layout.containers.metrics}
      />

      <HomeBenefitsSection
        sectionProps={layout.sections.benefits}
        containerProps={layout.containers.hero}
      />

      <HomeDivider variant="lightning" containerProps={layout.containers.divider} />

      <HomeFeatureSliderSection
        sectionProps={layout.sections.slider}
        containerProps={layout.containers.hero}
      />
    </Box>
  );
}

export default HomePage;
