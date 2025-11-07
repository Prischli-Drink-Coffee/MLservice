import React from "react";
import { Box, SimpleGrid, Stack, HStack, Icon } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Subtitle, Body, Footnote } from "../common/Typography";
import { colors, borderRadius } from "../../theme/tokens";
import { CheckCircleIcon, TimeIcon, LockIcon, RepeatIcon } from "@chakra-ui/icons";

const MotionBox = motion(Box);

const benefits = [
  {
    icon: CheckCircleIcon,
    title: "Специализация",
    description: "Таргетный подход к RAG с возможностью кастомизации под задачи пользователя",
    color: colors.brand.primary,
  },
  {
    icon: TimeIcon,
    title: "Масштабируемость",
    description: "Kafka для обработки больших объемов данных с горизонтальным масштабированием",
    color: colors.brand.secondary,
  },
  {
    icon: RepeatIcon,
    title: "Асинхронность",
    description: "Ноды устроены как асинхронные микросервисы для высокой производительности",
    color: "#f59e0b",
  },
  {
    icon: LockIcon,
    title: "Безопасность",
    description: "JWT-аутентификация, изолированные окружения, SSL/TSL шифрование.",
    color: colors.brand.tertiary,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

function BenefitsSection() {
  return (
    <Box w="full">
      <Stack spacing={{ base: 8, md: 10 }} align="center">
        {/* Section Header */}
        <Stack spacing={3} align="center" textAlign="center" maxW="800px">
          <Footnote
            variant="medium"
            color={colors.brand.primary}
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight={600}
          >
            Ключевые преимущества
          </Footnote>
          <Subtitle variant="large" fontSize={{ base: "26px", md: "32px" }}>
            Готовая инфраструктура для сложных пайплайнов
          </Subtitle>
          <Body variant="medium" color={colors.text.tertiary} maxW="650px">
            От прототипа до production за часы, а не недели. Без vendor lock-in.
          </Body>
        </Stack>

        {/* Benefits Grid */}
        <MotionBox
          w="full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 4, md: 5 }} w="full">
            {benefits.map((benefit, index) => (
              <MotionBox
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3 },
                }}
              >
                <Box
                  bg={colors.blur.dark}
                  borderRadius={borderRadius.lg}
                  p={{ base: 5, md: 6 }}
                  border="1px solid"
                  borderColor={colors.border.default}
                  h="full"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{
                    borderColor: benefit.color,
                    boxShadow: `0 0 25px ${benefit.color}40`,
                  }}
                  _before={{
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    bg: `linear-gradient(90deg, ${benefit.color}, transparent)`,
                    opacity: 0,
                    transition: "opacity 0.3s",
                  }}
                  sx={{
                    "&:hover::before": {
                      opacity: 1,
                    },
                  }}
                >
                  <Stack spacing={3}>
                    {/* Icon */}
                    <Box
                      bg={`${benefit.color}15`}
                      borderRadius={borderRadius.md}
                      p={3}
                      w="fit-content"
                    >
                      <Icon as={benefit.icon} boxSize={6} color={benefit.color} />
                    </Box>

                    {/* Title */}
                    <Subtitle variant="small" fontSize={{ base: "16px", md: "18px" }}>
                      {benefit.title}
                    </Subtitle>

                    {/* Description */}
                    <Body
                      variant="small"
                      color={colors.text.tertiary}
                      fontSize={{ base: "13px", md: "14px" }}
                      lineHeight="1.6"
                    >
                      {benefit.description}
                    </Body>
                  </Stack>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      </Stack>
    </Box>
  );
}

export default BenefitsSection;
