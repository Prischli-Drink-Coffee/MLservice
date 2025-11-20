import PropTypes from "prop-types";
import { Box, Container } from "@chakra-ui/react";
import BenefitsSection from "../../../components/home/BenefitsSection";

function HomeBenefitsSection({ sectionProps, containerProps }) {
  return (
    <Box {...sectionProps}>
      <Container maxW={containerProps.maxW} px={containerProps.px || 0}>
        <BenefitsSection />
      </Container>
    </Box>
  );
}

HomeBenefitsSection.propTypes = {
  sectionProps: PropTypes.object,
  containerProps: PropTypes.object,
};

HomeBenefitsSection.defaultProps = {
  sectionProps: {},
  containerProps: {},
};

export default HomeBenefitsSection;
