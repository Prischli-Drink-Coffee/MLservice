import PropTypes from "prop-types";
import { Box, Container } from "@chakra-ui/react";
import SectionDivider from "../../../components/common/SectionDivider";

function HomeDivider({ variant, containerProps }) {
  return (
    <Box>
      <Container maxW={containerProps.maxW} px={containerProps.px || 0}>
        <SectionDivider variant={variant} />
      </Container>
    </Box>
  );
}

HomeDivider.propTypes = {
  variant: PropTypes.string,
  containerProps: PropTypes.object,
};

HomeDivider.defaultProps = {
  variant: "electric",
  containerProps: {},
};

export default HomeDivider;
