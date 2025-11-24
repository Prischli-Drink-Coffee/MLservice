import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { colors } from "@theme/tokens";

const MotionBox = motion(Box);

/**
 * SectionDivider - Decorative animated divider between sections
 * @param {string} variant - Style variant: "electric", "gradient", "dots"
 */
function SectionDivider({ variant = "electric" }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Box position="relative" w="full" h="64px" my={{ base: 8, md: 12 }}>
        <Box
          position="absolute"
          top="50%"
          left="0"
          right="0"
          h="4px"
          borderRadius="full"
          bg={`linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.secondary}, ${colors.brand.tertiary})`}
          opacity={0.65}
          style={{ transform: "translateY(-50%)" }}
        />
      </Box>
    );
  }

  if (variant === "electric") {
    return (
      <Box
        position="relative"
        w="full"
        h={{ base: "100px", md: "140px" }}
        overflow="hidden"
        my={{ base: 10, md: 14 }}
      >
        {/* Central Glow Line */}
        <MotionBox
          position="absolute"
          top="50%"
          left="0"
          right="0"
          h="3px"
          bg={`linear-gradient(90deg,
            transparent 0%,
            ${colors.brand.primary}80 20%,
            ${colors.brand.secondary} 50%,
            ${colors.brand.primary}80 80%,
            transparent 100%)`}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          boxShadow={`0 0 30px ${colors.brand.primary}70, 0 0 60px ${colors.brand.secondary}50, 0 0 90px ${colors.brand.tertiary}30`}
        />

        {/* Animated Pulse Effect */}
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          w="180px"
          h="180px"
          borderRadius="full"
          bg={`radial-gradient(circle, ${colors.brand.primary}50 0%, ${colors.brand.secondary}20 40%, transparent 70%)`}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: [0, 1.8, 1.2], opacity: [0, 0.8, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
          style={{ transform: "translate(-50%, -50%)" }}
        />

        {/* Electric Particles */}
        {[...Array(8)].map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            top="50%"
            left={`${10 + i * 11}%`}
            w="6px"
            h="6px"
            borderRadius="full"
            bg={i % 2 === 0 ? colors.brand.primary : colors.brand.tertiary}
            initial={{ y: 0, opacity: 0, scale: 0 }}
            whileInView={{
              y: [0, -40, 0],
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
            }}
            viewport={{ once: true }}
            transition={{
              duration: 2.2,
              delay: 0.5 + i * 0.15,
              ease: "easeInOut",
            }}
            boxShadow={`0 0 15px ${i % 2 === 0 ? colors.brand.primary : colors.brand.tertiary}, 0 0 25px ${i % 2 === 0 ? colors.brand.primary : colors.brand.tertiary}60`}
          />
        ))}

        {/* Side Accent Lines */}
        <MotionBox
          position="absolute"
          top="50%"
          left="0"
          w={{ base: "80px", md: "150px" }}
          h="2px"
          bg={`linear-gradient(90deg, transparent, ${colors.brand.primary})`}
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          boxShadow={`0 0 15px ${colors.brand.primary}60`}
        />
        <MotionBox
          position="absolute"
          top="50%"
          right="0"
          w={{ base: "80px", md: "150px" }}
          h="2px"
          bg={`linear-gradient(90deg, ${colors.brand.primary}, transparent)`}
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          boxShadow={`0 0 15px ${colors.brand.primary}60`}
        />
      </Box>
    );
  }

  if (variant === "gradient") {
    return (
      <Box
        position="relative"
        w="full"
        h={{ base: "60px", md: "100px" }}
        overflow="hidden"
        my={{ base: 8, md: 12 }}
      >
        {/* Flowing Gradient */}
        <MotionBox
          position="absolute"
          top="50%"
          left="-10%"
          right="-10%"
          h="3px"
          bg={`linear-gradient(90deg,
            transparent 0%,
            ${colors.brand.primary} 25%,
            ${colors.brand.secondary} 50%,
            ${colors.brand.tertiary} 75%,
            transparent 100%)`}
          initial={{ x: "-100%", opacity: 0 }}
          whileInView={{ x: "0%", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          boxShadow={`0 0 15px ${colors.brand.secondary}50`}
          style={{ transform: "translateY(-50%)" }}
        />

        {/* Dots Pattern */}
        <Flex
          position="absolute"
          top="50%"
          left="0"
          right="0"
          justify="space-around"
          align="center"
          style={{ transform: "translateY(-50%)" }}
        >
          {[...Array(12)].map((_, i) => (
            <MotionBox
              key={i}
              w="6px"
              h="6px"
              borderRadius="full"
              bg={colors.border.default}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          ))}
        </Flex>
      </Box>
    );
  }

  if (variant === "lightning") {
    const travelLeftToRight = ["-120%", "120%"];
    const travelRightToLeft = ["120%", "-120%"];

    return (
      <Box
        position="relative"
        w="full"
        h={{ base: "100px", md: "140px" }}
        overflow="hidden"
        my={{ base: 10, md: 14 }}
      >
        {/* Base Track Lines */}
        <Box
          position="absolute"
          top="50%"
          left="0"
          right="0"
          h="2px"
          bg={colors.border.default}
          opacity={0.3}
          style={{ transform: "translateY(-50%)" }}
        />
        <Box
          position="absolute"
          top="calc(50% - 20px)"
          left="0"
          right="0"
          h="1px"
          bg={colors.border.default}
          opacity={0.15}
          style={{ transform: "translateY(-50%)" }}
        />
        <Box
          position="absolute"
          top="calc(50% + 20px)"
          left="0"
          right="0"
          h="1px"
          bg={colors.border.default}
          opacity={0.15}
          style={{ transform: "translateY(-50%)" }}
        />

        {/* Animated Lightning Bolt - Runs continuously with random direction */}
        <MotionBox
          position="absolute"
          top="50%"
          w="40%"
          h="5px"
          borderRadius="full"
          bg={`linear-gradient(90deg,
            ${colors.brand.primary}00 0%,
            ${colors.brand.primary} 10%,
            ${colors.brand.secondary} 30%,
            ${colors.brand.tertiary} 50%,
            ${colors.brand.secondary} 70%,
            ${colors.brand.primary} 90%,
            ${colors.brand.primary}00 100%)`}
          animate={{
            x: travelLeftToRight,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
          style={{ transform: "translateY(-50%)" }}
          boxShadow={`0 0 40px ${colors.brand.primary}90, 0 0 70px ${colors.brand.secondary}70, 0 0 100px ${colors.brand.tertiary}50`}
        />

        {/* Secondary Lightning - Faster, Thinner with random direction */}
        <MotionBox
          position="absolute"
          top="calc(50% + 20px)"
          w="30%"
          h="3px"
          borderRadius="full"
          bg={`linear-gradient(90deg,
            transparent 0%,
            ${colors.brand.tertiary} 20%,
            ${colors.brand.secondary} 50%,
            ${colors.brand.primary} 80%,
            transparent 100%)`}
          animate={{
            x: travelRightToLeft,
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2.8,
            delay: 0.5,
          }}
          style={{ transform: "translateY(-50%)" }}
          boxShadow={`0 0 30px ${colors.brand.tertiary}80`}
        />

        {/* Tertiary Lightning with random direction */}
        <MotionBox
          position="absolute"
          top="calc(50% - 20px)"
          w="32%"
          h="3px"
          borderRadius="full"
          bg={`linear-gradient(90deg,
            transparent 0%,
            ${colors.brand.secondary} 20%,
            ${colors.brand.primary} 50%,
            ${colors.brand.tertiary} 80%,
            transparent 100%)`}
          animate={{
            x: travelLeftToRight,
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 3.5,
            delay: 1.2,
          }}
          style={{ transform: "translateY(-50%)" }}
          boxShadow={`0 0 30px ${colors.brand.secondary}70`}
        />

        {/* Zigzag Lightning Path - Creates spline effect with random directions */}
        {[...Array(10)].map((_, i) => {
          const yOffset = i % 2 === 0 ? -15 : 15;
          const directionSequence = i % 2 === 0 ? travelLeftToRight : travelRightToLeft;
          return (
            <MotionBox
              key={`zigzag-${i}`}
              position="absolute"
              top={`calc(50% + ${yOffset}px)`}
              w="12%"
              h="3px"
              borderRadius="full"
              bg={`linear-gradient(90deg,
                ${i % 2 === 0 ? colors.brand.secondary : colors.brand.tertiary} 0%,
                ${colors.brand.primary} 50%,
                ${i % 2 === 0 ? colors.brand.tertiary : colors.brand.secondary} 100%)`}
              animate={{
                x: directionSequence,
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2,
                delay: i * 0.1,
              }}
              boxShadow={`0 0 15px ${i % 2 === 0 ? colors.brand.secondary : colors.brand.tertiary}70`}
            />
          );
        })}
      </Box>
    );
  }

  if (variant === "dots") {
    return (
      <Flex w="full" justify="center" align="center" gap={3} my={{ base: 8, md: 12 }} py={4}>
        {[...Array(5)].map((_, i) => (
          <MotionBox
            key={i}
            w={i === 2 ? "12px" : "8px"}
            h={i === 2 ? "12px" : "8px"}
            borderRadius="full"
            bg={
              i === 2
                ? colors.brand.primary
                : i % 2 === 0
                  ? colors.brand.secondary
                  : colors.border.default
            }
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: i === 2 ? 1 : 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            boxShadow={i === 2 ? `0 0 15px ${colors.brand.primary}70` : "none"}
          />
        ))}
      </Flex>
    );
  }

  return null;
}

export default SectionDivider;
