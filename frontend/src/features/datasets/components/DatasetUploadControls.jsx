import React, { useRef } from "react";
import { AttachmentIcon, RepeatIcon } from "@chakra-ui/icons";
import { Button, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import PrimaryButton from "@ui/atoms/PrimaryButton";
import { tokens, colors } from "@theme/tokens";

const filePropType = typeof File !== "undefined" ? PropTypes.instanceOf(File) : PropTypes.any;

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
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

function DatasetUploadControls({
  file,
  onFileSelect,
  onUpload,
  onRefresh,
  isUploading,
  isLoading,
}) {
  const inputRef = useRef(null);
  const handlePickFile = () => inputRef.current?.click();
  const handleChange = (event) => {
    onFileSelect(event.target.files?.[0] || null);
  };
  const fileName = file?.name ?? "Файл не выбран";
  const fileSize = file ? formatBytes(file.size) : "—";
  const disableUpload = !file || isUploading;

  return (
    <Stack
      direction={{ base: "column", xl: "row" }}
      spacing={4}
      bg="rgba(255,255,255,0.03)"
      border="1px solid rgba(255,255,255,0.08)"
      borderRadius={tokens.borderRadius.lg}
      p={{ base: 4, md: 5 }}
      minW={{ base: "100%", xl: "460px" }}
    >
      <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} hidden />
      <HStack spacing={4} align="flex-start" flex={1}>
        <Button
          onClick={handlePickFile}
          leftIcon={<AttachmentIcon />}
          variant="outline"
          borderColor="rgba(255,255,255,0.2)"
          _hover={{ borderColor: tokens.colors.brand.primary, color: colors.text.primary }}
          color={colors.text.secondary}
          size="sm"
        >
          Выбрать CSV
        </Button>
        <VStack align="flex-start" spacing={1} minW={0}>
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.15em"
            color={colors.text.tertiary}
          >
            Файл для загрузки
          </Text>
          <Text fontSize="md" color={colors.text.primary} noOfLines={1} maxW="260px">
            {fileName}
          </Text>
          <Text fontSize="sm" color={colors.text.secondary}>
            Размер: {fileSize}
          </Text>
        </VStack>
      </HStack>
      <HStack spacing={3} justify="flex-end">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RepeatIcon />}
          onClick={onRefresh}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          Обновить
        </Button>
        <PrimaryButton
          size="sm"
          onClick={onUpload}
          isLoading={isUploading}
          isDisabled={disableUpload}
        >
          Загрузить
        </PrimaryButton>
      </HStack>
    </Stack>
  );
}

DatasetUploadControls.propTypes = {
  file: filePropType,
  onFileSelect: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  isLoading: PropTypes.bool,
};

DatasetUploadControls.defaultProps = {
  file: null,
  isUploading: false,
  isLoading: false,
};

export default DatasetUploadControls;
