import React from "react";
import { Button as ChakraButton } from "@chakra-ui/react";
import { colors, borderRadius, dimensions, transitions } from "../../theme/tokens";

/**
 * PrimaryButton - Main CTA button with design system tokens
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Button text/content
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {function} props.onClick - Click handler
 * @param {object} props.rest - Additional Chakra Button props
 */
function PrimaryButton({ children, disabled, isLoading, size = "md", onClick, ...rest }) {
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
      bg={disabled ? colors.background.buttonDisabled : colors.background.buttonActive}
      color={colors.text.primaryInverted}
      borderRadius={borderRadius.sm}
      fontWeight={500}
      transition={transitions.smooth}
      _hover={
        !disabled && !isLoading
          ? {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(255, 255, 255, 0.15)",
            }
          : {}
      }
      _active={
        !disabled && !isLoading
          ? {
              transform: "translateY(0)",
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

export default PrimaryButton;
