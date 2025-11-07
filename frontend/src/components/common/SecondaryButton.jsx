import React from "react";
import { Button as ChakraButton } from "@chakra-ui/react";
import { colors, borderRadius, dimensions, transitions } from "../../theme/tokens";

/**
 * SecondaryButton - Outline button with design system tokens
 */
function SecondaryButton({ children, disabled, isLoading, size = "md", onClick, ...rest }) {
  const sizeMap = {
    sm: { h: "40px", px: 4, fontSize: "14px" },
    md: { h: dimensions.button.heightMobile, px: 6, fontSize: "14px" },
    lg: {
      h: { base: dimensions.button.heightMobile, md: dimensions.button.heightDesktop },
      px: 8,
      fontSize: { base: "14px", md: "18px" },
    },
  };

  return (
    <ChakraButton
      bg="transparent"
      color={disabled ? colors.text.quaternary : colors.text.primary}
      border="1px solid"
      borderColor={disabled ? colors.border.default : colors.border.medium}
      borderRadius={borderRadius.sm}
      fontWeight={500}
      transition={transitions.smooth}
      _hover={
        !disabled && !isLoading
          ? {
              borderColor: colors.text.primary,
              bg: colors.background.chineseBlack10,
            }
          : {}
      }
      _active={
        !disabled && !isLoading
          ? {
              bg: colors.background.chineseBlack50,
            }
          : {}
      }
      isDisabled={disabled}
      isLoading={isLoading}
      onClick={onClick}
      {...sizeMap[size]}
      {...rest}
    >
      {children}
    </ChakraButton>
  );
}

export default SecondaryButton;
