import PropTypes from "prop-types";
import { Box, Container } from "@chakra-ui/react";
import GlowingCard from "@ui/molecules/GlowingCard";
import AuthenticatedMetricsDistributions from "@features/home/components/AuthenticatedMetricsDistributions";

function HomeMetricsSection({ isAuthenticated, sectionProps, containerProps }) {
  if (!isAuthenticated) return null;

  return (
    <Box {...sectionProps}>
      <Container maxW={containerProps.maxW} px={containerProps.px || 0}>
        <GlowingCard intensity="medium" w="full">
          <AuthenticatedMetricsDistributions />
        </GlowingCard>
      </Container>
    </Box>
  );
}

HomeMetricsSection.propTypes = {
  isAuthenticated: PropTypes.bool,
  sectionProps: PropTypes.object,
  containerProps: PropTypes.object,
};

HomeMetricsSection.defaultProps = {
  isAuthenticated: false,
  sectionProps: {},
  containerProps: {},
};

export default HomeMetricsSection;
