import React from "react";
import { Box, Container } from "@chakra-ui/react";
import SectionDivider from "@ui/atoms/SectionDivider";
import { colors } from "@theme/tokens";
import GradientParticles from "@features/info/components/GradientParticles";
import HeroSection from "@features/info/components/sections/HeroSection";
import TeamSection from "@features/info/components/sections/TeamSection";
import AdvantagesSection from "@features/info/components/sections/AdvantagesSection";
import TechStackSection from "@features/info/components/sections/TechStackSection";
import ContactSection from "@features/info/components/sections/ContactSection";
import { useInfoPageContent } from "@features/info/useInfoPageContent";
import { useLayoutControls } from "@context/LayoutContext";

function InfoPage() {
  const { heroDescription, teamMembers, advantagesList, techStackList, projectAdvantagesTitle } =
    useInfoPageContent();
  const { setVariant, setFooterVisible } = useLayoutControls();

  React.useEffect(() => {
    setVariant("full");
    setFooterVisible(false);
    return () => {
      setVariant("container");
      setFooterVisible(true);
    };
  }, [setVariant, setFooterVisible]);

  return (
    <Box
      as="main"
      bg={colors.background.darkPrimary}
      w="full"
      minH="100vh"
      position="relative"
      overflow="hidden"
    >
      <GradientParticles />

      <HeroSection description={heroDescription} />

      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="lightning" />
      </Container>

      <TeamSection members={teamMembers} />

      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="electric" />
      </Container>

      <AdvantagesSection advantages={advantagesList} title={projectAdvantagesTitle} />

      <TechStackSection techStack={techStackList} />

      <ContactSection />
    </Box>
  );
}

export default InfoPage;
