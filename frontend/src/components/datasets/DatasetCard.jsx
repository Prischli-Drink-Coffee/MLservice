import React from "react";
import { Box, HStack, VStack, Text, Badge, Stack, Button, Wrap, WrapItem, Icon, SimpleGrid, Divider } from "@chakra-ui/react";
import { ArrowDownIcon, DeleteIcon, InfoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import PrimaryButton from "../common/PrimaryButton";
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

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return `rgba(255,255,255,${alpha})`;
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const int = parseInt(cleanHex, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DatasetCard = ({
  dataset,
  onDownload,
  onDelete,
  isDownloading = false,
  isDeleting = false,
  accentColor: accentColorProp = tokens.colors.brand.primary,
}) => {
  const version = dataset.version || dataset.meta?.version;
  const tags = dataset.meta?.tags || dataset.tags || [];
  const records = dataset.records ?? dataset.rows ?? dataset.meta?.rows;
  const rawColumns = dataset.columns ?? dataset.meta?.columns;
  const columns = Array.isArray(rawColumns) ? rawColumns.length : rawColumns;
  const sizeLabel = formatBytes(dataset.file_size_bytes ?? dataset.size_bytes ?? dataset.meta?.size_bytes);
  const datasetType = dataset.meta?.type || dataset.type || "CSV";
  const accentColor = accentColorProp;
  const accentTint = hexToRgba(accentColor, 0.14);
  const accentBorder = hexToRgba(accentColor, 0.45);
  const statItems = [
    { label: "Загружен", value: formatDate(dataset.created_at || dataset.meta?.created_at) },
    { label: "Размер", value: sizeLabel || "—" },
    { label: "Строк / Колонок", value: `${formatNumber(records) || "—"} / ${formatNumber(columns) || "—"}` },
  ];
  const actionsDisabled = isDeleting || isDownloading;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35 }}
      position="relative"
      borderRadius={tokens.borderRadius.xl}
      bg="rgba(5,5,10,0.85)"
      backdropFilter="blur(25px)"
      border="1px solid"
      borderColor={accentBorder}
      p={{ base: 5, md: 6 }}
      overflow="hidden"
      boxShadow="0 20px 45px rgba(0,0,0,0.35)"
    >
      <Box position="absolute" insetX={-10} top={-10} h="120px" bg={accentTint} filter="blur(50px)" opacity={0.55} />
      <Box
        position="absolute"
        inset={0}
        bg={`linear-gradient(135deg, ${hexToRgba(accentColor, 0.35)}, rgba(5,5,10,0.95))`}
        opacity={0.65}
      />
      <Box position="absolute" insetX={0} top={0} h="4px" bg={accentColor} opacity={0.85} />

      <VStack align="stretch" spacing={6} position="relative">
        <HStack justify="space-between" align={{ base: "flex-start", md: "center" }} spacing={4} flexWrap="wrap">
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <HStack spacing={3}>
              <Badge bg={accentTint} color={colors.text.primary} borderRadius={tokens.borderRadius.full} px={3} py={1} fontSize="xs">
                {datasetType}
              </Badge>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
                Датасет
              </Text>
            </HStack>
            <Text fontSize="xl" fontWeight={600} color={colors.text.primary} noOfLines={2} lineHeight="1.2">
              {dataset.name || dataset.meta?.name || "Без названия"}
            </Text>
            <Text fontSize="xs" color={colors.text.tertiary} fontFamily="mono" letterSpacing="0.05em">
              ID: {dataset.id}
            </Text>
          </VStack>
          <Stack spacing={2} align="flex-end">
            {version && (
              <Badge
                bg={hexToRgba(accentColor, 0.2)}
                color={colors.text.primary}
                borderRadius={tokens.borderRadius.full}
                px={4}
                py={1}
                fontSize="xs"
              >
                v{version}
              </Badge>
            )}
            {dataset.status && (
              <Badge
                variant="outline"
                borderColor={hexToRgba(accentColor, 0.4)}
                color={colors.text.primary}
                borderRadius={tokens.borderRadius.full}
                px={4}
                py={1}
                fontSize="xs"
              >
                {dataset.status}
              </Badge>
            )}
          </Stack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {statItems.map((item) => (
            <Box
              key={item.label}
              p={4}
              borderRadius={tokens.borderRadius.lg}
              bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.05)"
            >
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
                {item.label}
              </Text>
              <Text mt={1} fontWeight={600} color={colors.text.primary}>
                {item.value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {tags.length > 0 && (
          <Wrap spacing={2}>
            {tags.slice(0, 4).map((tag) => (
              <WrapItem key={tag}>
                <Badge
                  bg={accentTint}
                  color={colors.text.primary}
                  borderRadius={tokens.borderRadius.full}
                  fontSize="xs"
                  px={3}
                  py={1}
                >
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

        <Divider borderColor="rgba(255,255,255,0.08)" />

        <HStack justify="space-between" align={{ base: "flex-start", md: "center" }} flexWrap="wrap" gap={3}>
          <HStack spacing={3} color={colors.text.tertiary} fontSize="sm">
            <Icon as={InfoIcon} w={4} h={4} />
            <Text>Ссылка откроется в новой вкладке. Действия можно отменить до 15 секунд.</Text>
          </HStack>
          <HStack spacing={3}>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              rightIcon={<DeleteIcon />}
              onClick={() => onDelete?.(dataset)}
              isLoading={isDeleting}
              isDisabled={isDownloading}
            >
              Удалить
            </Button>
            <PrimaryButton
              size="sm"
              rightIcon={<ArrowDownIcon />}
              onClick={() => onDownload?.(dataset)}
              isLoading={isDownloading}
              isDisabled={actionsDisabled}
            >
              Скачать
            </PrimaryButton>
          </HStack>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default DatasetCard;
