import React from "react";
import { Box, HStack, VStack, Badge, Wrap, WrapItem } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Title, Body, Footnote } from "../common/Typography";
import PrimaryButton from "../common/PrimaryButton";
import SecondaryButton from "../common/SecondaryButton";
import Logo from "../common/assets/Logo";
import { colors, borderRadius, gradients } from "../../theme/tokens";
import { HERO_COPY, HERO_TECH_STACK } from "../../constants";

const MotionBox = motion(Box);
const MotionBadge = motion(Badge);

/**
 * HeroSection - Main landing section with title, description and CTAs
 * @param {boolean} isAuthenticated - User authentication status
 */
function HeroSection({ isAuthenticated }) {
  return (
    <Box
      position="relative"
      w="full"
      overflow="hidden"
      borderRadius={{ base: borderRadius.lg, md: borderRadius["2xl"] }}
      bg={`linear-gradient(145deg, rgba(7,9,18,0.85), rgba(5,5,5,0.6)), ${gradients.dusk}`}
      border="1px solid rgba(255,255,255,0.06)"
      boxShadow="0 30px 80px rgba(0,0,0,0.35)"
      p={{ base: 6, md: 10 }}
      _before={{
        content: '""',
        position: "absolute",
        inset: "-25%",
        background: gradients.aurora,
        filter: "blur(60px)",
        opacity: 0.35,
        animation: "glowPulse 12s ease-in-out infinite",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0.05) 0, transparent 30%)",
        opacity: 0.4,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    >
      <MotionBox
        position="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        w="full"
      >
        <MotionBox
          position="absolute"
          top={{ base: "-40px", md: "-60px" }}
          right={{ base: "-20px", md: "-60px" }}
          w={{ base: "140px", md: "200px" }}
          h={{ base: "140px", md: "200px" }}
          borderRadius="full"
          bg={gradients.midnightMesh}
          opacity={0.4}
          filter="blur(20px)"
          animate={{
            scale: [0.9, 1.05, 0.95],
            rotate: [0, 8, -4, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <VStack align="flex-start" spacing={{ base: 6, md: 8 }} w="full" position="relative">
        {/* Logo and Brand */}
        <HStack spacing={3}>
          <Logo boxSize={{ base: 8, md: 10 }} />
          <Footnote variant="medium" color={colors.text.secondary}>
            {HERO_COPY.brandFootnote}
          </Footnote>
        </HStack>

        {/* Feature Pills */}
        <Wrap spacing={2}>
          {HERO_TECH_STACK.map((tech, i) => (
            <WrapItem key={tech}>
              <MotionBadge
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                bg="rgba(255,255,255,0.02)"
                color={colors.text.primary}
                px={3}
                py={1.5}
                borderRadius={borderRadius.lg}
                fontSize="11px"
                fontWeight={500}
                border="1px solid"
                borderColor="rgba(255,255,255,0.15)"
                backdropFilter="blur(9px)"
                boxShadow="0 10px 30px rgba(0,0,0,0.35)"
              >
                {tech}
              </MotionBadge>
            </WrapItem>
          ))}
        </Wrap>

        {/* Main Title */}
        <Title variant="large" fontSize={{ base: "32px", md: "44px", lg: "52px" }} lineHeight="1.2">
          Обработка данных
          <br />и ML-модели
          <br />
          <Box as="span" color={colors.brand.primary}>
            {HERO_COPY.titleHighlight}
          </Box>
        </Title>

        {/* Description */}
        <VStack align="flex-start" spacing={3} maxW={{ base: "full", md: "650px" }}>
          <Body variant="large" fontSize={{ base: "15px", md: "17px" }}>
            {HERO_COPY.descriptionPrimary}
          </Body>
          <Body
            variant="medium"
            color={colors.text.tertiary}
            fontSize={{ base: "13px", md: "15px" }}
          >
            {HERO_COPY.descriptionSecondary}
          </Body>
        </VStack>

        {/* CTA Section */}
        <VStack align="flex-start" spacing={4} w="full" maxW={{ base: "full", md: "500px" }} pt={3}>
          {isAuthenticated ? (
            <HStack spacing={3} flexWrap="wrap" w="full">
              <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton as={NavLink} to={HERO_COPY.authenticatedPrimaryCta.to} size="md">
                  {HERO_COPY.authenticatedPrimaryCta.label}
                </PrimaryButton>
              </MotionBox>
              <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SecondaryButton as={NavLink} to={HERO_COPY.authenticatedSecondaryCta.to} size="md">
                  {HERO_COPY.authenticatedSecondaryCta.label}
                </SecondaryButton>
              </MotionBox>
            </HStack>
          ) : (
            <>
              <HStack spacing={3} flexWrap="wrap" w="full">
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <PrimaryButton as={NavLink} to={HERO_COPY.guestPrimaryCta.to} size="md">
                    {HERO_COPY.guestPrimaryCta.label}
                  </PrimaryButton>
                </MotionBox>
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <SecondaryButton as={NavLink} to={HERO_COPY.guestSecondaryCta.to} size="md">
                    {HERO_COPY.guestSecondaryCta.label}
                  </SecondaryButton>
                </MotionBox>
              </HStack>
              <Footnote variant="medium" color={colors.text.tertiary} pt={1} fontSize="12px">
                {HERO_COPY.guestFootnote}
              </Footnote>
            </>
          )}
        </VStack>
        </VStack>
      </MotionBox>
    </Box>
  );
}

export default HeroSection;
