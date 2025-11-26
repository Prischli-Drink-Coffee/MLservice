import React from "react";
import { Box, HStack, VStack, Text, Icon, Progress } from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { MotionBox } from "@ui/motionPrimitives";
import { tokens } from "@theme/tokens";

/**
 * PasswordStrength - индикатор силы пароля с проверками
 * Анимированные требования с иконками
 */
const PasswordStrength = ({ password }) => {
  const checks = [
    {
      id: "length",
      label: "Минимум 8 символов",
      test: (pwd) => pwd.length >= 8,
    },
    {
      id: "letter",
      label: "Хотя бы одна буква",
      test: (pwd) => /[A-Za-zА-Яа-я]/.test(pwd),
    },
    {
      id: "digit",
      label: "Хотя бы одна цифра",
      test: (pwd) => /\d/.test(pwd),
    },
  ];

  const passedChecks = checks.filter((check) => check.test(password));
  const strengthPercentage = (passedChecks.length / checks.length) * 100;

  // Цвет прогресса в зависимости от силы
  const getProgressColor = () => {
    if (passedChecks.length === 0) return tokens.colors.text.tertiary;
    if (passedChecks.length === 1) return tokens.colors.error;
    if (passedChecks.length === 2) return "#f59e0b"; // orange
    return tokens.colors.success;
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      mt={3}
      p={4}
      bg={tokens.colors.blur.medium}
      borderRadius={tokens.borderRadius.md}
      border="1px solid"
      borderColor={tokens.colors.border.light}
    >
      {/* Progress bar */}
      <Box mb={3}>
        <HStack justify="space-between" mb={1}>
          <Text fontSize={tokens.typography.footnote.small} color={tokens.colors.text.secondary}>
            Сила пароля
          </Text>
          <Text
            fontSize={tokens.typography.footnote.small}
            color={getProgressColor()}
            fontWeight="600"
          >
            {passedChecks.length === 0 && "Слабый"}
            {passedChecks.length === 1 && "Слабый"}
            {passedChecks.length === 2 && "Средний"}
            {passedChecks.length === 3 && "Сильный"}
          </Text>
        </HStack>
        <Progress
          value={strengthPercentage}
          size="sm"
          borderRadius={tokens.borderRadius.sm}
          bg={tokens.colors.blur.dark}
          sx={{
            "& > div": {
              background: `linear-gradient(90deg, ${getProgressColor()}, ${getProgressColor()}99)`,
              transition: "all 0.3s",
            },
          }}
        />
      </Box>

      {/* Requirements list */}
      <VStack align="stretch" spacing={2}>
        {checks.map((check, idx) => {
          const passed = check.test(password);
          return (
            <MotionBox
              key={check.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <HStack spacing={2}>
                <Icon
                  as={passed ? CheckCircleIcon : WarningIcon}
                  color={passed ? tokens.colors.success : tokens.colors.text.tertiary}
                  w={4}
                  h={4}
                  transition="color 0.2s"
                />
                <Text
                  fontSize={tokens.typography.footnote.small}
                  color={passed ? tokens.colors.text.primary : tokens.colors.text.tertiary}
                  transition="color 0.2s"
                >
                  {check.label}
                </Text>
              </HStack>
            </MotionBox>
          );
        })}
      </VStack>
    </MotionBox>
  );
};

export default PasswordStrength;
