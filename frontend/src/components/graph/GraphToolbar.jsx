import React from "react";
import {
  Box,
  HStack,
  Button,
  IconButton,
  Input,
  Tooltip,
  Divider,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ChevronDownIcon, CheckIcon, RepeatIcon, DownloadIcon, AddIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";

const MotionBox = motion(Box);

/**
 * GraphToolbar - верхняя панель управления графом
 */
const GraphToolbar = ({
  graphName,
  onGraphNameChange,
  onSave,
  onSaveAs,
  onValidate,
  onExport,
  onAutoLayout,
  onToggleGrid,
  onToggleMinimap,
  isSaving,
  isValidating,
  hasChanges,
  gridEnabled = true,
  minimapEnabled = true,
}) => {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      position="sticky"
      top={0}
      zIndex={100}
      bg={tokens.colors.blur.dark}
      backdropFilter="blur(20px)"
      borderBottom="1px solid"
      borderColor={tokens.colors.border.subtle}
      px={4}
      py={3}
    >
      <HStack spacing={{ base: 2, md: 3 }} justify="space-between" w="full">
        {/* Left section: Graph name */}
        <HStack
          spacing={{ base: 2, md: 3 }}
          flex={{ base: "0 1 auto", md: 1 }}
          minW={{ base: "120px", md: "200px" }}
        >
          <Input
            placeholder="Название графа"
            value={graphName}
            onChange={(e) => onGraphNameChange(e.target.value)}
            size={{ base: "sm", md: "md" }}
            bg={tokens.colors.blur.light}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.md}
            color={tokens.colors.text.primary}
            fontSize={{
              base: tokens.typography.footnote.medium,
              md: tokens.typography.body.medium,
            }}
            _placeholder={{ color: tokens.colors.text.tertiary }}
            _hover={{
              borderColor: tokens.colors.border.medium,
            }}
            _focus={{
              borderColor: tokens.colors.brand.primary,
              boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
            }}
            maxW={{ base: "150px", md: "400px" }}
          />
          {hasChanges && (
            <MotionBox initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <Tooltip
                label="Есть несохранённые изменения"
                placement="bottom"
                bg="gray.700"
                color="white"
              >
                <Box w={2} h={2} borderRadius="full" bg={tokens.colors.warning} />
              </Tooltip>
            </MotionBox>
          )}
        </HStack>

        {/* Center section: Actions */}
        <HStack spacing={{ base: 1, md: 2 }} flex="0 0 auto">
          {/* Save dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size={{ base: "sm", md: "md" }}
              bg={tokens.colors.brand.primary}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.md}
              fontSize={{
                base: tokens.typography.footnote.medium,
                md: tokens.typography.body.medium,
              }}
              px={{ base: 2, md: 4 }}
              _hover={{
                bg: tokens.colors.brand.secondary,
              }}
              _active={{
                bg: tokens.colors.brand.secondary,
              }}
              isLoading={isSaving}
            >
              <Box display={{ base: "none", md: "block" }}>Сохранить</Box>
              <Box display={{ base: "block", md: "none" }}>Save</Box>
            </MenuButton>
            <MenuList
              bg={tokens.colors.blur.dark}
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor={tokens.colors.border.subtle}
              borderRadius={tokens.borderRadius.md}
            >
              <MenuItem
                icon={<CheckIcon />}
                bg="transparent"
                color={tokens.colors.text.primary}
                _hover={{ bg: tokens.colors.blur.mid }}
                onClick={onSave}
              >
                Сохранить
              </MenuItem>
              <MenuItem
                icon={<AddIcon />}
                bg="transparent"
                color={tokens.colors.text.primary}
                _hover={{ bg: tokens.colors.blur.mid }}
                onClick={onSaveAs}
              >
                Сохранить как новый
              </MenuItem>
              <MenuItem
                icon={<DownloadIcon />}
                bg="transparent"
                color={tokens.colors.text.primary}
                _hover={{ bg: tokens.colors.blur.mid }}
                onClick={onExport}
              >
                Экспортировать JSON
              </MenuItem>
            </MenuList>
          </Menu>

          <Divider
            orientation="vertical"
            h="24px"
            borderColor={tokens.colors.border.subtle}
            display={{ base: "none", md: "block" }}
          />

          {/* Validate */}
          <Tooltip label="Валидировать граф" placement="bottom" bg="gray.700" color="white">
            <IconButton
              icon={
                <Icon viewBox="0 0 24 24" w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }}>
                  <path
                    fill="currentColor"
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  />
                </Icon>
              }
              size={{ base: "sm", md: "md" }}
              bg={tokens.colors.blur.light}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.md}
              _hover={{
                bg: tokens.colors.blur.mid,
                color: tokens.colors.success,
              }}
              onClick={onValidate}
              isLoading={isValidating}
              aria-label="Validate graph"
              display={{ base: "none", md: "inline-flex" }}
            />
          </Tooltip>

          {/* Auto-layout */}
          <Tooltip label="Авто-раскладка" placement="bottom" bg="gray.700" color="white">
            <IconButton
              icon={<RepeatIcon />}
              size={{ base: "sm", md: "md" }}
              bg={tokens.colors.blur.light}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.md}
              _hover={{
                bg: tokens.colors.blur.mid,
                color: tokens.colors.brand.primary,
              }}
              onClick={onAutoLayout}
              aria-label="Auto-layout"
              display={{ base: "none", md: "inline-flex" }}
            />
          </Tooltip>

          {/* Grid toggle */}
          <Tooltip
            label={gridEnabled ? "Скрыть сетку" : "Показать сетку"}
            placement="bottom"
            bg="gray.700"
            color="white"
          >
            <IconButton
              icon={
                <Icon viewBox="0 0 24 24" w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }}>
                  <path
                    fill="currentColor"
                    d="M10 10v2H8v-2h2zm0 4v2H8v-2h2zm-2 4v2H6v-2h2zm-2-4v2H4v-2h2zm12-6h-2v2h2v-2zm0 4h-2v2h2v-2zm2 4h-2v2h2v-2zm-2-8h-2v2h2V8zm-6 2h2v2h-2v-2zm2 4h-2v2h2v-2zm0 4h-2v2h2v-2zm-8-8h2v2H8V8zm4 0h2v2h-2V8zm4-4h2v2h-2V4zm-4 0h2v2h-2V4zm-4 0h2v2H8V4z"
                  />
                </Icon>
              }
              size={{ base: "sm", md: "md" }}
              bg={gridEnabled ? tokens.colors.blur.mid : tokens.colors.blur.light}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.md}
              _hover={{
                bg: tokens.colors.blur.mid,
                color: tokens.colors.brand.primary,
              }}
              onClick={onToggleGrid}
              aria-label="Toggle grid"
            />
          </Tooltip>

          {/* Minimap toggle */}
          <Tooltip
            label={minimapEnabled ? "Скрыть миникарту" : "Показать миникарту"}
            placement="bottom"
            bg="gray.700"
            color="white"
          >
            <IconButton
              icon={
                <Icon viewBox="0 0 24 24" w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }}>
                  <path
                    fill="currentColor"
                    d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                  />
                </Icon>
              }
              size={{ base: "sm", md: "md" }}
              bg={minimapEnabled ? tokens.colors.blur.mid : tokens.colors.blur.light}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.md}
              _hover={{
                bg: tokens.colors.blur.mid,
                color: tokens.colors.brand.primary,
              }}
              onClick={onToggleMinimap}
              aria-label="Toggle minimap"
            />
          </Tooltip>
        </HStack>
      </HStack>
    </MotionBox>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(GraphToolbar);
