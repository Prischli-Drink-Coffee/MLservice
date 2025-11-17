import React from "react";
import { Box, HStack, VStack, Badge, Wrap, WrapItem } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Title, Body, Footnote } from "../common/Typography";
import PrimaryButton from "../common/PrimaryButton";
import SecondaryButton from "../common/SecondaryButton";
import Logo from "../common/assets/Logo";
import { colors, borderRadius } from "../../theme/tokens";

const MotionBox = motion(Box);
const MotionBadge = motion(Badge);

const nameProject = "MLservice";
const futureList = [
  "FastAPI",
  "Alembic",
  "PostgreSQL",
  "React",
  "Chakra UI",
  "Docker",
  "Nginx",
  "Pydantic",
  "Scikit-learn",
  "Redis",
];

const textDescription = {
  text1: "MLservice — это платформа для обучения ML-моделей. Загрузите данные, настройте параметры, а дальше мы сами позаботимся обо всём остальном.",
  text2: "Платформа создавалась ML инженерами для неподкованных пользователей, которым нужна надёжная инфраструктура и воспроизводимость экспериментов."
}

const textPrimaryButton = "Загрузить данные";
const textSecondaryButton = "Обучить модель";

/**
 * HeroSection - Main landing section with title, description and CTAs
 * @param {boolean} isAuthenticated - User authentication status
 */
function HeroSection({ isAuthenticated }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      w="full"
    >
      <VStack align="flex-start" spacing={{ base: 6, md: 8 }} w="full">
        {/* Logo and Brand */}
        <HStack spacing={3}>
          <Logo boxSize={{ base: 8, md: 10 }} />
          <Footnote variant="medium" color={colors.text.secondary}>
            {nameProject} Platform
          </Footnote>
        </HStack>

        {/* Feature Pills */}
        <Wrap spacing={2}>
          {futureList.map((tech, i) => (
            <WrapItem key={tech}>
              <MotionBadge
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                bg={colors.blur.accent}
                color={colors.text.primary}
                px={3}
                py={1}
                borderRadius={borderRadius.lg}
                fontSize="11px"
                fontWeight={500}
                border="1px solid"
                borderColor={colors.border.default}
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
            на нашей совести
          </Box>
        </Title>

        {/* Description */}
        <VStack align="flex-start" spacing={3} maxW={{ base: "full", md: "650px" }}>
          <Body variant="large" fontSize={{ base: "15px", md: "17px" }}>
            {textDescription.text1}
          </Body>
          <Body
            variant="medium"
            color={colors.text.tertiary}
            fontSize={{ base: "13px", md: "15px" }}
          >
            {textDescription.text2}
          </Body>
        </VStack>

        {/* CTA Section */}
        <VStack align="flex-start" spacing={4} w="full" maxW={{ base: "full", md: "500px" }} pt={3}>
          {isAuthenticated ? (
            <HStack spacing={3} flexWrap="wrap" w="full">
              <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <PrimaryButton as={NavLink} to="/datasets" size="md">
                  {textPrimaryButton}
                </PrimaryButton>
              </MotionBox>
              <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SecondaryButton as={NavLink} to="/training" size="md">
                  {textSecondaryButton}
                </SecondaryButton>
              </MotionBox>
            </HStack>
          ) : (
            <>
              <HStack spacing={3} flexWrap="wrap" w="full">
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <PrimaryButton as={NavLink} to="/login" size="md">
                    Войти в консоль
                  </PrimaryButton>
                </MotionBox>
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <SecondaryButton as={NavLink} to="/register" size="md">
                    Регистрация
                  </SecondaryButton>
                </MotionBox>
              </HStack>
              <Footnote variant="medium" color={colors.text.tertiary} pt={1} fontSize="12px">
                После входа вы сможете собирать пайплайны, подключать Telegram-ботов и отслеживать
                выполнение задач в реальном времени.
              </Footnote>
            </>
          )}
        </VStack>
      </VStack>
    </MotionBox>
  );
}

export default HeroSection;
