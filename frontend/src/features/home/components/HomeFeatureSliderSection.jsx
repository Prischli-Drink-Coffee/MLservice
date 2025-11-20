import PropTypes from "prop-types";
import { Box, Container } from "@chakra-ui/react";
import FeatureSlider from "../../../components/home/FeatureSlider";

function HomeFeatureSliderSection({ sectionProps, containerProps }) {
  return (
    <Box {...sectionProps}>
      <Container maxW={containerProps.maxW} px={containerProps.px || 0}>
        <FeatureSlider />
      </Container>
    </Box>
  );
}

HomeFeatureSliderSection.propTypes = {
  sectionProps: PropTypes.object,
  containerProps: PropTypes.object,
};

HomeFeatureSliderSection.defaultProps = {
  sectionProps: {},
  containerProps: {},
};

export default HomeFeatureSliderSection;
