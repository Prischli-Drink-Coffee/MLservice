import React from "react";
import { Box, HStack, VStack, Text, Badge, Stack, Button, Wrap, WrapItem, Icon } from "@chakra-ui/react";
import { ArrowDownIcon, DeleteIcon, InfoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens, colors } from "../../theme/tokens";

const MotionBox = motion(Box);

const formatDate = (value) => {
  if (!value) return "Дата не указана";
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return value;
  }
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("ru-RU").format(value);
};

const DatasetCard = ({
  dataset,
  onDownload,
  onDelete,
  isDownloading = false,
  isDeleting = false,
  accentColor = tokens.colors.brand.primary,
}) => {
  const version = dataset.version || dataset.meta?.version;
  const tags = dataset.meta?.tags || dataset.tags || [];
  const records = dataset.records ?? dataset.rows ?? dataset.meta?.rows;
  const rawColumns = dataset.columns ?? dataset.meta?.columns;
  const columns = Array.isArray(rawColumns) ? rawColumns.length : rawColumns;
  const sizeLabel = formatBytes(dataset.file_size_bytes ?? dataset.size_bytes ?? dataset.meta?.size_bytes);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      position="relative"
      borderRadius={tokens.borderRadius.lg}
      bg={tokens.colors.blur.dark}
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor={tokens.colors.border.subtle}
      p={6}
      overflow="hidden"
    >
      <Box position="absolute" insetX={0} top={0} h="3px" bg={accentColor} opacity={0.75} />

      <VStack align="stretch" spacing={5}>
        <HStack justify="space-between" align="flex-start" spacing={4}>
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <Text fontSize={tokens.typography.footnote.small} letterSpacing="0.15em" textTransform="uppercase" color={colors.text.tertiary}>
              Датасет
            </Text>
            <Text fontSize="xl" fontWeight={600} color={colors.text.primary} noOfLines={2} lineHeight="1.2">
              {dataset.name || dataset.meta?.name || "Без названия"}
            </Text>
            <Text fontSize="xs" color={colors.text.tertiary} fontFamily="mono" letterSpacing="-0.01em">
              ID: {dataset.id}
            </Text>
          </VStack>
          <Stack spacing={2} align="flex-end">
            {version && (
              <Badge colorScheme="purple" borderRadius={tokens.borderRadius.sm} px={3} py={1} fontSize="xs">
                v{version}
              </Badge>
            )}
            {dataset.status && (
              <Badge colorScheme="green" variant="outline" borderRadius={tokens.borderRadius.sm} px={3} py={1} fontSize="xs">
                {dataset.status}
              </Badge>
            )}
          </Stack>
        </HStack>

        <Stack direction={{ base: "column", sm: "row" }} spacing={4} divider={<Box w={{ base: "full", sm: "1px" }} h={{ base: "1px", sm: "32px" }} bg={tokens.colors.border.subtle} alignSelf="center" />}
        >
          <VStack align="flex-start" spacing={1} flex={1}>
            <Text fontSize="xs" textTransform="uppercase" color={colors.text.tertiary}>
              Загружен
            </Text>
            <Text fontWeight={500} color={colors.text.primary}>{formatDate(dataset.created_at || dataset.meta?.created_at)}</Text>
          </VStack>
          <VStack align="flex-start" spacing={1} flex={1}>
            <Text fontSize="xs" textTransform="uppercase" color={colors.text.tertiary}>
              Размер
            </Text>
            <Text fontWeight={500} color={colors.text.primary}>{sizeLabel || "—"}</Text>
          </VStack>
          <VStack align="flex-start" spacing={1} flex={1}>
            <Text fontSize="xs" textTransform="uppercase" color={colors.text.tertiary}>
              Строк / Колонок
            </Text>
            <Text fontWeight={500} color={colors.text.primary}>
              {formatNumber(records) || "—"} / {formatNumber(columns) || "—"}
            </Text>
          </VStack>
        </Stack>

        {tags.length > 0 && (
          <Wrap spacing={2}>
            {tags.slice(0, 4).map((tag) => (
              <WrapItem key={tag}>
                <Badge bg={`${accentColor}20`} color={accentColor} borderRadius={tokens.borderRadius.sm} fontSize="xs" px={3} py={1}>
                  {tag}
                </Badge>
              </WrapItem>
            ))}
            {tags.length > 4 && (
              <WrapItem>
                <Badge variant="ghost" color={colors.text.tertiary} fontSize="xs">
                  +{tags.length - 4}
                </Badge>
              </WrapItem>
            )}
          </Wrap>
        )}

        <HStack justify="space-between" align={{ base: "flex-start", sm: "center" }} flexWrap="wrap" gap={3}>
          <HStack spacing={2} color={colors.text.tertiary} fontSize="xs">
            <Icon as={InfoIcon} w={4} h={4} />
            <Text>Ссылка откроется в новой вкладке</Text>
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              rightIcon={<DeleteIcon />}
              onClick={() => onDelete?.(dataset)}
              isLoading={isDeleting}
            >
              Удалить
            </Button>
            <Button
              size="sm"
              colorScheme="brand"
              rightIcon={<ArrowDownIcon />}
              onClick={() => onDownload?.(dataset)}
              isLoading={isDownloading}
              isDisabled={isDeleting}
            >
              Скачать
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default DatasetCard;
