import React from "react";
import { Box, VStack } from "@chakra-ui/react";
import { MotionBox } from "@ui/motionPrimitives";
import { tokens } from "@theme/tokens";
import useInteractiveGlow from "@hooks/useInteractiveGlow";

/**
 * AuthFormCard - обёртка для форм авторизации
 * С эффектом свечения на границе, отслеживающим курсор
 */
const AuthFormCard = ({ children, maxW = "480px", ...rest }) => {
  const { glowRef, glowStyle, onGlowMouseMove, onGlowMouseLeave } = useInteractiveGlow();
  const gradientCss = `radial-gradient(circle 600px at var(--glow-x, 50%) var(--glow-y, 50%), ${tokens.colors.brand.primary}40, transparent 40%)`;
  const { style: motionStyle, ...motionProps } = rest;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      maxW={maxW}
      mx="auto"
      position="relative"
      ref={glowRef}
      style={{ ...glowStyle, ...motionStyle }}
      onMouseMove={onGlowMouseMove}
      onMouseLeave={onGlowMouseLeave}
      {...motionProps}
    >
      {/* Gradient border with mouse tracking */}
      <Box
        position="absolute"
        inset="-1px"
        borderRadius={tokens.borderRadius.lg}
        background={gradientCss}
        opacity={0.6}
        transition="opacity 0.3s"
        _groupHover={{ opacity: 1 }}
        pointerEvents="none"
      />

      {/* Inner card with blur background */}
      <Box
        position="relative"
        bg={tokens.colors.blur.dark}
        backdropFilter="blur(20px)"
        borderRadius={tokens.borderRadius.lg}
        border="1px solid"
        borderColor={tokens.colors.border.subtle}
        p={8}
        overflow="hidden"
      >
        {/* Decorative glow spots */}
        <Box
          position="absolute"
          top="-100px"
          right="-100px"
          w="200px"
          h="200px"
          bg={tokens.colors.brand.secondary}
          borderRadius="50%"
          filter="blur(80px)"
          opacity={0.15}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-80px"
          left="-80px"
          w="160px"
          h="160px"
          bg={tokens.colors.brand.tertiary}
          borderRadius="50%"
          filter="blur(60px)"
          opacity={0.1}
          pointerEvents="none"
        />

        <VStack spacing={6} position="relative" zIndex={1}>
          {children}
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default AuthFormCard;
