import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, HStack, Stack, usePrefersReducedMotion } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { colors, borderRadius, gradients } from "../../theme/tokens";
import { Subtitle, Body } from "../common/Typography";
import PrimaryButton from "../common/PrimaryButton";
import { FEATURE_SLIDES } from "../../constants";

const MotionBox = motion(Box);

const SLIDE_TRANSITION = { duration: 0.85, ease: "easeInOut" };

function featureTransforms(offset) {
  if (offset === 0) {
    return {
      x: "0%",
      scale: 1,
      rotateY: 0,
      opacity: 1,
      filter: "blur(0px)",
      zIndex: 3,
    };
  }

  if (offset === 1) {
    return {
      x: "50%",
      scale: 0.84,
      rotateY: -18,
      opacity: 0.45,
      filter: "blur(2px)",
      zIndex: 2,
    };
  }

  if (offset === FEATURE_SLIDES.length - 1) {
    return {
      x: "-50%",
      scale: 0.84,
      rotateY: 18,
      opacity: 0.45,
      filter: "blur(2px)",
      zIndex: 2,
    };
  }

  return {
    x: "0%",
    scale: 0.7,
    rotateY: 0,
    opacity: 0,
    filter: "blur(6px)",
    zIndex: 1,
  };
}

export default function FeatureSlider() {
  const [index, setIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  // Минимальное расстояние свайпа (в пикселях)
  const minSwipeDistance = 50;

  const goTo = useCallback((nextIndex) => {
    setIndex((prev) => {
      const length = FEATURE_SLIDES.length;
      return (
        (((typeof nextIndex === "number" ? nextIndex : prev + nextIndex) % length) + length) %
        length
      );
    });
  }, []);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goTo(1);
    } else if (isRightSwipe) {
      goTo(-1);
    }

    // Сброс состояний для следующего свайпа
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (!motionEnabled || isPaused || FEATURE_SLIDES.length <= 1) return undefined;
    const id = setInterval(() => goTo(1), 3500);
    return () => clearInterval(id);
  }, [goTo, isPaused, motionEnabled]);

  const indicators = useMemo(
    () =>
      FEATURE_SLIDES.map((slide, slideIdx) => (
        <MotionBox
          key={slide.id}
          whileHover={motionEnabled ? { scale: 1.3 } : undefined}
          whileTap={motionEnabled ? { scale: 0.9 } : undefined}
        >
          <Button
            size="xs"
            minW="auto"
            w={slideIdx === index ? "24px" : "8px"}
            h="8px"
            borderRadius="full"
            bg={slideIdx === index ? gradients.aurora : "rgba(255,255,255,0.12)"}
            border="1px solid rgba(255,255,255,0.12)"
            boxShadow={slideIdx === index ? "0 0 12px rgba(47,116,255,0.6)" : undefined}
            _hover={{ bg: gradients.prism, filter: "brightness(1.1)" }}
            onClick={() => goTo(slideIdx)}
            aria-label={`Перейти к слайду ${slideIdx + 1}`}
            transition="all 0.4s ease"
            p={0}
          />
        </MotionBox>
      )),
    [goTo, index, motionEnabled],
  );

  return (
    <Stack spacing={{ base: 6, md: 10 }} align="center" w="full" position="relative">
      <Box
        position="absolute"
        inset={{ base: "10% -5%", md: "12% -10%" }}
        background={gradients.horizon}
        opacity={0.15}
        filter="blur(120px)"
        pointerEvents="none"
      />
      <Box textAlign="center" w="full" position="relative" zIndex={1}>
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
        >
          Возможности платформы
        </Badge>
        <Subtitle variant="large" fontSize={{ base: "26px", md: "34px" }} mb={2}>
          Всё необходимое в одном интерфейсе
        </Subtitle>
        <Body
          variant="medium"
          color={colors.text.tertiary}
          maxW="800px"
          mx="auto"
          fontSize={{ base: "13px", md: "15px" }}
        >
          Интерактивный тур по ключевым функциям: от обучения моделей до мониторинга.
        </Body>
      </Box>

      <Box
        position="relative"
        w="full"
        maxW="1400px"
        mx="auto"
        px={{ base: 4, md: 8, lg: 12 }}
        overflow="hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Box
          position="relative"
          w="full"
          h={{ base: "480px", md: "550px" }}
          perspective="1600px"
          overflow="visible"
          borderRadius={{ base: borderRadius.xl, md: borderRadius["2xl"] }}
          border="1px solid rgba(255,255,255,0.08)"
          bg={`linear-gradient(150deg, rgba(4,6,12,0.92), rgba(7,9,18,0.85)), ${gradients.midnightMesh}`}
          boxShadow="0 45px 90px rgba(0,0,0,0.55)"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-35%",
            background: gradients.prism,
            opacity: 0.25,
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: "linear-gradient(130deg, rgba(255,255,255,0.08), transparent 55%)",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          <Flex
            justify="center"
            align="center"
            w="full"
            h="full"
            position="relative"
            overflow="visible"
            zIndex={1}
          >
            {FEATURE_SLIDES.map((slide, slideIdx) => {
              const offset = (slideIdx - index + FEATURE_SLIDES.length) % FEATURE_SLIDES.length;
              const animateProps = motionEnabled
                ? featureTransforms(offset)
                : {
                    x: "0%",
                    scale: 1,
                    rotateY: 0,
                    opacity: offset === 0 ? 1 : 0,
                    filter: "blur(0px)",
                    zIndex: offset === 0 ? 3 : 1,
                  };

              return (
                <MotionBox
                  key={slide.id}
                  position="absolute"
                  top="50%"
                  left="50%"
                  style={{ translateX: "-50%", translateY: "-50%" }}
                  w={{ base: "85%", md: "75%", lg: "65%" }}
                  maxW="700px"
                  minH={{ base: "400px", md: "480px" }}
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow={
                    offset === 0
                      ? "0 30px 70px rgba(10,14,25,0.8), 0 0 55px rgba(47,116,255,0.45)"
                      : "0 20px 40px rgba(5,7,13,0.65)"
                  }
                  bg="rgba(5,7,13,0.9)"
                  animate={animateProps}
                  transition={motionEnabled ? SLIDE_TRANSITION : { duration: 0 }}
                  backgroundImage={`${slide.gradient}, radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 55%)`}
                  backgroundSize="cover"
                  backgroundPosition="center"
                  role="group"
                  _before={
                    offset === 0
                      ? {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          padding: "2px",
                          background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 50%, ${colors.brand.tertiary} 100%)`,
                          WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                          pointerEvents: "none",
                          animation: motionEnabled ? "rotate-gradient 8s linear infinite" : "none",
                        }
                      : {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          padding: "1px",
                          background: colors.border.default,
                          WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                          pointerEvents: "none",
                        }
                  }
                >
                  <Box
                    position="absolute"
                    inset={0}
                    bg="rgba(3,4,8,0.75)"
                    backdropFilter="blur(16px)"
                  />
                  <Stack
                    spacing={3}
                    position="relative"
                    h="full"
                    justify="space-between"
                    p={{ base: 6, md: 8, lg: 10 }}
                  >
                    <Stack spacing={2}>
                      <Badge
                        bg="rgba(255,255,255,0.08)"
                        color={colors.text.primary}
                        alignSelf="flex-start"
                        borderRadius={borderRadius.full}
                        px={3}
                        py={1}
                        fontSize="10px"
                        fontWeight={600}
                        textTransform="uppercase"
                        letterSpacing="0.15em"
                        border="1px solid rgba(255,255,255,0.2)"
                      >
                        {slide.badge}
                      </Badge>
                      <Subtitle
                        variant="medium"
                        fontSize={{ base: "16px", md: "20px" }}
                        lineHeight="1.3"
                      >
                        {slide.title}
                      </Subtitle>
                      <Body
                        variant="small"
                        color={colors.text.tertiary}
                        fontSize={{ base: "12px", md: "14px" }}
                        lineHeight="1.5"
                        maxW="520px"
                      >
                        {slide.description}
                      </Body>
                    </Stack>

                    {offset === 0 && (
                      <HStack spacing={2}>
                        <MotionBox
                          whileHover={motionEnabled ? { scale: 1.05 } : undefined}
                          whileTap={motionEnabled ? { scale: 0.95 } : undefined}
                        >
                          <PrimaryButton size="xs" fontSize="11px">
                            Подробнее
                          </PrimaryButton>
                        </MotionBox>
                        <MotionBox
                          whileHover={motionEnabled ? { scale: 1.05 } : undefined}
                          whileTap={motionEnabled ? { scale: 0.95 } : undefined}
                        >
                          <Button
                            variant="ghost"
                            size="xs"
                            fontSize="11px"
                            color={colors.text.secondary}
                            _hover={{
                              bg: colors.background.chineseBlack10,
                              color: colors.text.primary,
                            }}
                          >
                            Документация →
                          </Button>
                        </MotionBox>
                      </HStack>
                    )}
                  </Stack>
                </MotionBox>
              );
            })}
          </Flex>
        </Box>

        {/* Indicator Dots */}
        <HStack justify="center" gap={2} mt={{ base: 6, md: 8 }}>
          {indicators}
        </HStack>
      </Box>
    </Stack>
  );
}
