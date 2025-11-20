import PropTypes from "prop-types";
import { Container, SimpleGrid } from "@chakra-ui/react";
import HeroSection from "../../../components/home/HeroSection";
import PlatformInfoCard from "../../../components/home/PlatformInfoCard";

function HomeHeroSection({ isAuthenticated, health, gridProps, containerProps }) {
  return (
    <Container maxW={containerProps.maxW} px={containerProps.px || 0}>
      <SimpleGrid {...gridProps}>
        <HeroSection isAuthenticated={isAuthenticated} />
        <PlatformInfoCard isAuthenticated={isAuthenticated} health={health} />
      </SimpleGrid>
    </Container>
  );
}

HomeHeroSection.propTypes = {
  isAuthenticated: PropTypes.bool,
  health: PropTypes.object,
  gridProps: PropTypes.object,
  containerProps: PropTypes.object,
};

HomeHeroSection.defaultProps = {
  isAuthenticated: false,
  health: null,
  gridProps: {},
  containerProps: {},
};

export default HomeHeroSection;
