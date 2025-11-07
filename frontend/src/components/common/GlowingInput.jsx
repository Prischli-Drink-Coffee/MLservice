import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from "@chakra-ui/react";
import { AttachmentIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { motion, useAnimation } from "framer-motion";

const MotionBox = motion(Box);

export default function GlowingInput({
  placeholder = "Опишите, что хотите автоматизировать",
  onSubmit,
}) {
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });
  const controls = useAnimation();

  const accent = "#2f74ff";
  const glowSecondary = "#8b5cf6";
  const glowTertiary = "#1dd1a1";
  const inputBg = useColorModeValue("white", "rgba(33, 33, 33, 0.88)");
  const iconColor = useColorModeValue("brand.500", "accent");
  const placeholderColor = useColorModeValue("text.muted", "text.muted");

  useEffect(() => {
    controls.start({
      x: [42, 58, 47, 60, 40, 50],
      y: [48, 52, 60, 40, 55, 50],
      transition: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: 10,
        ease: "easeInOut",
      },
    });
  }, [controls]);

  const gradientCss = useMemo(
    () =>
      `radial-gradient(circle at ${gradientPos.x}% ${gradientPos.y}%,
          ${accent} 0%,
          ${glowSecondary} 45%,
          ${glowTertiary} 80%)`,
    [accent, glowSecondary, glowTertiary, gradientPos.x, gradientPos.y],
  );

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setGradientPos({ x, y });
  };

  const handleSubmit = () => {
    if (!onSubmit) return;
    onSubmit();
  };

  return (
    <MotionBox
      role="presentation"
      onMouseMove={handleMouseMove}
      animate={controls}
      custom={gradientPos}
      initial={{ boxShadow: "0 0 18px rgba(47, 116, 255, 0.25)", scale: 1 }}
      whileHover={{ boxShadow: "0 0 28px rgba(139, 92, 246, 0.65)", scale: 1.01 }}
      transition={{ duration: 0.45 }}
      bg="transparent"
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
      px={{ base: 4, md: 5 }}
      py={{ base: 3, md: 4 }}
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: "2px",
        background: gradientCss,
        backgroundSize: "200% 200%",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
        transition: "background 0.3s ease",
      }}
    >
      <InputGroup position="relative">
        <InputLeftElement pointerEvents="none">
          <AttachmentIcon color={iconColor} boxSize={5} />
        </InputLeftElement>
        <Input
          placeholder={placeholder}
          bg={inputBg}
          borderRadius="xl"
          py={{ base: 6, md: 7 }}
          pl="48px"
          pr="64px"
          fontSize={{ base: "md", md: "lg" }}
          color="text.primary"
          _placeholder={{ color: placeholderColor }}
          border="1px solid"
          borderColor="borderSubtle"
          boxShadow="0 2px 12px rgba(15, 23, 42, 0.45)"
        />
        <IconButton
          aria-label="Запустить"
          icon={<ArrowForwardIcon />}
          position="absolute"
          right={{ base: 1, md: 2 }}
          top="50%"
          transform="translateY(-50%)"
          size="lg"
          borderRadius="full"
          bg="accent"
          color="white"
          boxShadow="0 0 16px rgba(47, 116, 255, 0.55)"
          _hover={{ bg: "accent", filter: "brightness(1.1)" }}
          _active={{ bg: "accent", filter: "brightness(0.95)" }}
          onClick={handleSubmit}
        />
      </InputGroup>
    </MotionBox>
  );
}
