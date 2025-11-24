import React from "react";
import PropTypes from "prop-types";
import { Badge } from "@chakra-ui/react";
import { colors, borderRadius, gradients } from "@theme/tokens";

function FeatureBadge({ children, ...props }) {
  return (
    <Badge
      bg="transparent"
      color={colors.text.primary}
      borderRadius={borderRadius.full}
      px={4}
      py={1.5}
      mb={3}
      fontSize="11px"
      fontWeight={500}
      textTransform="uppercase"
      letterSpacing="wider"
      border="1px solid rgba(255,255,255,0.12)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        background: gradients.aurora,
        opacity: 0.6,
        filter: "blur(6px)",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: "3px",
        borderRadius: borderRadius.full,
        border: "1px solid rgba(255,255,255,0.2)",
      }}
      {...props}
    >
      {children}
    </Badge>
  );
}

FeatureBadge.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FeatureBadge;
