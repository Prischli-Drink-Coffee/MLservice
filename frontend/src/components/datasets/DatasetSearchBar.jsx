import React from "react";
import { Box, HStack, VStack, Text, Badge, Button, Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens, colors } from "../../theme/tokens";

const MotionBox = motion(Box);

const DatasetSearchBar = ({
  value,
  onChange,
  onClear,
  totalCount = 0,
  filteredCount,
  placeholder = "Поиск по названию, версии или ID...",
  title = "Каталог датасетов",
  description = "Быстрый поиск по названию, версии или внутреннему идентификатору.",
  counterLabel = "Найдено:",
  badgeColorScheme = "purple",
}) => {
  const activeCount = typeof filteredCount === "number" ? filteredCount : totalCount;
  const hasQuery = Boolean(value?.trim());

  return (
    <MotionBox initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <VStack align="stretch" spacing={4}>
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" h="full">
            <SearchIcon color={colors.text.tertiary} w={5} h={5} />
          </InputLeftElement>
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            pl="52px"
            pr={hasQuery ? "48px" : "20px"}
            h="64px"
            bg={tokens.colors.blur.dark}
            borderRadius={tokens.borderRadius.lg}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            color={colors.text.primary}
            fontSize="lg"
            _placeholder={{ color: colors.text.tertiary }}
            _hover={{ borderColor: tokens.colors.border.medium }}
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
              color={colors.text.tertiary}
              _hover={{ color: colors.text.primary }}
            >
              <CloseIcon w={3} h={3} />
            </Button>
          )}
        </InputGroup>

        <HStack justify="space-between" flexWrap="wrap" spacing={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.15em" color={colors.text.tertiary}>
              {title}
            </Text>
            <Text fontSize="sm" color={colors.text.secondary}>
              {description}
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Text fontSize="sm" color={colors.text.tertiary}>
              {counterLabel}
            </Text>
            <Badge colorScheme={badgeColorScheme} borderRadius={tokens.borderRadius.full} px={4} py={1} fontSize="sm">
              {activeCount} / {totalCount}
            </Badge>
          </HStack>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default DatasetSearchBar;
