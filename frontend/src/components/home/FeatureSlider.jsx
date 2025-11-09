import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { colors, borderRadius } from "../../theme/tokens";
import { Subtitle, Body } from "../common/Typography";
import PrimaryButton from "../common/PrimaryButton";

const MotionBox = motion(Box);

const slides = [
  {
    id: 1,
    title: "Быстрый старт графа",
    description:
      "Клонируйте пример, меняйте узлы и запускайте пайплайн в пару кликов. Ускорьте экспериментирование.",
    badge: "Графы",
    gradient:
      "radial-gradient(circle at 20% 20%, rgba(47,116,255,0.45), rgba(139,92,246,0.25) 40%, rgba(15,23,42,0.4) 80%)",
  },
  {
    id: 2,
    title: "Телеграм-триггеры",
    description:
      "Маршрутизируйте входящие сообщения по командам, keyword'ам и callback'ам. Автоперезапуск ботов без даунтайма.",
    badge: "Telegram",
    gradient:
      "radial-gradient(circle at 80% 30%, rgba(20,184,166,0.35), rgba(47,116,255,0.2) 45%, rgba(15,23,42,0.45) 75%)",
  },
  {
    id: 3,
    title: "Аналитика выполнения",
    description:
      "Собирайте статусы, тайминги и результаты узлов. Настраивайте оповещения и повторный запуск прямо из интерфейса.",
    badge: "Мониторинг (В разработке)",
    gradient:
      "radial-gradient(circle at 50% 60%, rgba(244,114,182,0.35), rgba(47,116,255,0.2) 40%, rgba(15,23,42,0.45) 85%)",
  },
  {
    id: 4,
    title: "Интеграции с API",
    description:
      "Встроенные коннекторы к OpenAI, Pinecone, HuggingFace и другим. Легко добавляйте свои через HTTP или SDK.",
    badge: "Интеграции (В разработке)",
    gradient:
      "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.35), rgba(20,184,166,0.2) 45%, rgba(15,23,42,0.4) 75%)",
  },
  {
    id: 5,
    title: "Реестр нод",
    description: "Библиотека с подробным описанием каждоый существующей ноды.",
    badge: "Ноды",
    gradient:
      "radial-gradient(circle at 70% 20%, rgba(236,72,153,0.35), rgba(139,92,246,0.2) 45%, rgba(15,23,42,0.4) 75%)",
  },
];

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

  if (offset === slides.length - 1) {
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

  // Минимальное расстояние свайпа (в пикселях)
  const minSwipeDistance = 50;

  const goTo = useCallback((nextIndex) => {
    setIndex((prev) => {
      const length = slides.length;
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
    if (isPaused || slides.length <= 1) return undefined;
    const id = setInterval(() => goTo(1), 3500);
    return () => clearInterval(id);
  }, [goTo, isPaused]);

  const indicators = useMemo(
    () =>
      slides.map((slide, slideIdx) => (
        <MotionBox key={slide.id} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}>
          <Button
            size="xs"
            minW="auto"
            w={slideIdx === index ? "24px" : "8px"}
            h="8px"
            borderRadius="full"
            bg={slideIdx === index ? colors.brand.primary : colors.background.jet50}
            _hover={{ bg: colors.brand.primary, filter: "brightness(1.1)" }}
            onClick={() => goTo(slideIdx)}
            aria-label={`Перейти к слайду ${slideIdx + 1}`}
            transition="all 0.4s ease"
            p={0}
          />
        </MotionBox>
      )),
    [goTo, index],
  );

  return (
    <Stack spacing={{ base: 6, md: 10 }} align="center" w="full">
      <Box textAlign="center" w="full">
        <Badge
          bg={colors.blur.accent}
          color={colors.text.primary}
          borderRadius={borderRadius.lg}
          px={3}
          py={1}
          mb={3}
          fontSize="11px"
          fontWeight={500}
          textTransform="uppercase"
          letterSpacing="wider"
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
          Интерактивный тур по ключевым функциям: от создания графов до мониторинга.
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
        >
          <Flex
            justify="center"
            align="center"
            w="full"
            h="full"
            position="relative"
            overflow="visible"
          >
            {slides.map((slide, slideIdx) => {
              const offset = (slideIdx - index + slides.length) % slides.length;
              const animateProps = featureTransforms(offset);

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
                      ? "0 0 45px rgba(47,116,255,0.45), 0 0 80px rgba(139,92,246,0.35)"
                      : "0 0 20px rgba(15,23,42,0.45)"
                  }
                  bg={colors.blur.dark}
                  animate={animateProps}
                  transition={SLIDE_TRANSITION}
                  backgroundImage={slide.gradient}
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
                          animation: "rotate-gradient 8s linear infinite",
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
                    bg={colors.blur.dark}
                    backdropFilter="blur(12px)"
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
                        bg={colors.background.jet50}
                        color={colors.text.primary}
                        alignSelf="flex-start"
                        borderRadius={borderRadius.md}
                        px={2}
                        py={0.5}
                        fontSize="10px"
                        fontWeight={500}
                        textTransform="uppercase"
                        letterSpacing="wide"
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
                      >
                        {slide.description}
                      </Body>
                    </Stack>

                    {offset === 0 && (
                      <HStack spacing={2}>
                        <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <PrimaryButton size="xs" fontSize="11px">
                            Подробнее
                          </PrimaryButton>
                        </MotionBox>
                        <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
