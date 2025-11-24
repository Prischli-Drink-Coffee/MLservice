import React from "react";
import { Box, HStack, VStack, Text, Badge, Button, Input, InputGroup, InputLeftElement, Stack, Divider, Tag, Icon } from "@chakra-ui/react";
import { SearchIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens, colors } from "@theme/tokens";

const MotionBox = motion(Box);

const VARIANT_PRESETS = {
  datasets: {
    title: "Каталог датасетов",
    description: "Быстрый поиск по названию, версии или внутреннему идентификатору.",
    counterLabel: "Найдено:",
    badgeColorScheme: "purple",
    placeholder: "Поиск по названию, версии или ID...",
    ribbon: "CSV",
  },
  artifacts: {
    title: "Репозиторий артефактов",
    description: "Отфильтруйте модели по идентификатору, ссылке или значениям метрик.",
    counterLabel: "Отображается:",
    badgeColorScheme: "green",
    placeholder: "Поиск по дате, URL, метрикам или ID...",
  },
  runs: {
    title: "История запусков",
    description: "Найдите запуск по дате, имени модели или значениям метрик.",
    counterLabel: "Показано:",
    badgeColorScheme: "blue",
    placeholder: "Поиск по дате, метрикам или ID запуска...",
  },
};

const DEFAULT_VARIANT = "datasets";

const DatasetSearchBar = ({
  value,
  onChange,
  onClear,
  totalCount = 0,
  filteredCount,
  placeholder,
  title,
  description,
  counterLabel,
  badgeColorScheme,
  variant = DEFAULT_VARIANT,
}) => {
  const preset = VARIANT_PRESETS[variant] ?? VARIANT_PRESETS[DEFAULT_VARIANT];
  const resolvedPlaceholder = placeholder ?? preset.placeholder;
  const resolvedTitle = title ?? preset.title;
  const resolvedDescription = description ?? preset.description;
  const resolvedCounterLabel = counterLabel ?? preset.counterLabel;
  const resolvedBadgeColor = badgeColorScheme ?? preset.badgeColorScheme;
  const activeCount = typeof filteredCount === "number" ? filteredCount : totalCount;
  const hasQuery = Boolean(value?.trim());
  const coverage = totalCount ? Math.round((activeCount / Math.max(totalCount, 1)) * 100) : 100;
  const ribbonLabel = preset.ribbon ?? "Поиск";

  return (
    <MotionBox
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
    >
      <Box
        position="relative"
        borderRadius={tokens.borderRadius.xl}
        border="1px solid"
        borderColor={tokens.colors.border.subtle}
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          bg={`linear-gradient(145deg, rgba(5,5,10,0.9), rgba(5,5,5,0.55)), ${tokens.gradients.dusk}`}
          opacity={0.95}
        />
        <Box position="absolute" inset={0} bg={tokens.gradients.midnightMesh} opacity={0.4} />

        <Stack spacing={5} position="relative" p={{ base: 5, md: 6 }}>
          <HStack justify="space-between" align="flex-start" spacing={4} flexWrap="wrap">
            <VStack align="flex-start" spacing={1} maxW={{ base: "full", md: "60%" }}>
              <HStack spacing={3}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
                  {resolvedTitle}
                </Text>
                <Tag size="sm" borderRadius={tokens.borderRadius.full} bg="rgba(47,116,255,0.12)" color={colors.text.secondary}>
                  <InfoOutlineIcon />
                  <Text as="span" ml={2} fontSize="xs">
                    {ribbonLabel}
                  </Text>
                </Tag>
              </HStack>
              <Text fontSize="lg" color={colors.text.primary} fontWeight={500} lineHeight="1.4">
                {resolvedDescription}
              </Text>
            </VStack>
            <VStack align="flex-end" spacing={1} textAlign="right">
              <Text fontSize="sm" color={colors.text.tertiary}>
                {resolvedCounterLabel}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={resolvedBadgeColor} borderRadius={tokens.borderRadius.full} px={4} py={1} fontSize="sm">
                  {activeCount} / {totalCount}
                </Badge>
                <Badge bg="rgba(255,255,255,0.08)" borderRadius={tokens.borderRadius.full} px={3} py={1} fontSize="xs">
                  {coverage}% охват
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          <Box position="relative">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="full">
                <SearchIcon color={colors.text.tertiary} w={5} h={5} />
              </InputLeftElement>
              <Input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={resolvedPlaceholder}
                pl="52px"
                pr={hasQuery ? "48px" : "24px"}
                h={{ base: "60px", md: "68px" }}
                bg={tokens.colors.blur.dark}
                borderRadius={tokens.borderRadius.lg}
                border="1px solid"
                borderColor={tokens.colors.border.medium}
                color={colors.text.primary}
                fontSize="lg"
                _placeholder={{ color: colors.text.tertiary }}
                _hover={{ borderColor: tokens.colors.brand.primary }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}, ${tokens.shadows.glowSubtle}`,
                }}
              />
              {hasQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => onClear?.()}
                  color={colors.text.secondary}
                  _hover={{ color: colors.text.primary }}
                >
                  <CloseIcon w={3} h={3} />
                </Button>
              )}
            </InputGroup>
            <Box
              position="absolute"
              inset={{ base: "auto", top: "10px", right: "10px" }}
              bottom={hasQuery ? "-14px" : "-18px"}
              opacity={0.12}
              pointerEvents="none"
              bg={tokens.gradients.prism}
              filter="blur(45px)"
            />
          </Box>

          <Stack direction={{ base: "column", md: "row" }} spacing={4} align="stretch">
            <HStack spacing={3} flex={1}>
              <Box w="10px" h="10px" borderRadius="full" bg="rgba(47,116,255,0.95)" boxShadow="0 0 20px rgba(47,116,255,0.7)" />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
                  Доступно
                </Text>
                <Text fontWeight={600} color={colors.text.primary}>
                  {totalCount} источников
                </Text>
              </VStack>
            </HStack>
            <Divider orientation={{ base: "horizontal", md: "vertical" }} borderColor="rgba(255,255,255,0.08)" />
            <HStack spacing={3} flex={1} color={colors.text.secondary}>
              <Icon as={InfoOutlineIcon} w={4} h={4} />
              <Text fontSize="sm">Поддерживается мгновенный фильтр по ID, версии и тегам.</Text>
            </HStack>
          </Stack>
        </Stack>
      </Box>
    </MotionBox>
  );
};

export default DatasetSearchBar;
