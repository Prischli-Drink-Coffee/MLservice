import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Tooltip,
  Badge,
  Textarea,
  Button,
  Icon,
  Collapse,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getCategoryConfig } from "../../utils/categoryHelpers";
import ConfigEditor from "./ConfigEditor";

const MotionBox = motion(Box);

/**
 * PropertiesPanel - панель редактирования свойств выбранной ноды
 */
const PropertiesPanel = ({
  selectedNode,
  onUpdateNode,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [dataJson, setDataJson] = React.useState("");
  const [jsonError, setJsonError] = React.useState(null);
  const [configValues, setConfigValues] = React.useState({});
  const { isOpen: showPorts, onToggle: togglePorts } = useDisclosure({ defaultIsOpen: true });
  const { isOpen: showConfig, onToggle: toggleConfig } = useDisclosure({ defaultIsOpen: true });
  const toast = useToast();

  React.useEffect(() => {
    if (selectedNode) {
      try {
        const formatted = JSON.stringify(selectedNode.data._rawData || {}, null, 2);
        setDataJson(formatted);
        setJsonError(null);
        // Загрузить конфигурационные значения
        setConfigValues(selectedNode.data._rawData || {});
      } catch (e) {
        setDataJson("{}");
        setConfigValues({});
      }
    }
  }, [selectedNode]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(dataJson);
      setJsonError(null);
      // onUpdateNode ожидает (nodeId, newData) — передаём id выбранной ноды
      onUpdateNode(selectedNode.id, parsed);
      // Показываем уведомление об успешном применении свойств
      toast({ title: "Свойства применены", status: "success", duration: 2000 });
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const handleCancel = () => {
    if (selectedNode) {
      const formatted = JSON.stringify(selectedNode.data._rawData || {}, null, 2);
      setDataJson(formatted);
      setJsonError(null);
      setConfigValues(selectedNode.data._rawData || {});
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfigValues(newConfig);
    // Автоматически обновлять JSON при изменении config
    const formatted = JSON.stringify(newConfig, null, 2);
    setDataJson(formatted);
  };

  if (!selectedNode) {
    return null;
  }

  if (isCollapsed) {
    return (
      <MotionBox
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        position="absolute"
        right={0}
        top="50%"
        transform="translateY(-50%)"
        zIndex={50}
      >
        <Tooltip label="Показать свойства" placement="left">
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={onToggleCollapse}
            size="sm"
            bg={tokens.colors.blur.dark}
            color={tokens.colors.text.primary}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.md}
            _hover={{
              bg: tokens.colors.blur.mid,
              borderColor: tokens.colors.brand.primary,
            }}
            aria-label="Expand properties panel"
          />
        </Tooltip>
      </MotionBox>
    );
  }

  const nodeType = selectedNode.data._rawType || selectedNode.data.label;
  const nodeName = selectedNode.data.label || nodeType;
  const category = selectedNode.data.meta?.category || "default";
  const categoryConfig = getCategoryConfig(category);
  const inputs = selectedNode.data.__inputs || {};
  const outputs = selectedNode.data.__outputs || {};

  return (
    <MotionBox
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.3 }}
      w="320px"
      h="full"
      bg={tokens.colors.blur.dark}
      backdropFilter="blur(20px)"
      borderLeft="1px solid"
      borderColor={tokens.colors.border.subtle}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <HStack p={3} borderBottom="1px solid" borderColor={tokens.colors.border.subtle}>
        <VStack align="start" spacing={0} flex={1}>
          <Text
            fontSize={tokens.typography.body.medium}
            fontWeight="600"
            color={tokens.colors.text.primary}
          >
            Свойства ноды
          </Text>
          <Text fontSize="10px" color={tokens.colors.text.tertiary}>
            {nodeType}
          </Text>
        </VStack>
        <Tooltip label="Закрыть" placement="left">
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={onToggleCollapse}
            size="sm"
            variant="ghost"
            color={tokens.colors.text.tertiary}
            _hover={{
              bg: tokens.colors.blur.mid,
              color: tokens.colors.brand.primary,
            }}
            aria-label="Collapse properties panel"
          />
        </Tooltip>
      </HStack>

      {/* Content */}
      <VStack
        align="stretch"
        spacing={0}
        flex={1}
        overflow="auto"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: tokens.colors.blur.dark,
          },
          "&::-webkit-scrollbar-thumb": {
            background: tokens.colors.border.medium,
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: tokens.colors.brand.primary,
          },
        }}
      >
        {/* Node info */}
        <Box p={3} borderBottom="1px solid" borderColor={tokens.colors.border.subtle}>
          <HStack spacing={2} mb={2}>
            <Box
              p={2}
              borderRadius={tokens.borderRadius.sm}
              bg={`${categoryConfig.color}15`}
              color={categoryConfig.color}
            >
              {categoryConfig.icon({ w: 5, h: 5 })}
            </Box>
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="13px" fontWeight="600" color={tokens.colors.text.primary}>
                {nodeName}
              </Text>
              <Badge fontSize="10px" colorScheme="purple" borderRadius={tokens.borderRadius.sm}>
                {categoryConfig.label}
              </Badge>
            </VStack>
          </HStack>
        </Box>

        {/* Ports section */}
        <Box borderBottom="1px solid" borderColor={tokens.colors.border.subtle}>
          <HStack
            p={3}
            cursor="pointer"
            onClick={togglePorts}
            _hover={{ bg: tokens.colors.blur.light }}
          >
            <Text fontSize="12px" fontWeight="600" color={tokens.colors.text.primary} flex={1}>
              Порты
            </Text>
            <Icon
              viewBox="0 0 24 24"
              w={4}
              h={4}
              color={tokens.colors.text.tertiary}
              transform={showPorts ? "rotate(180deg)" : "rotate(0deg)"}
              transition="transform 0.2s"
            >
              <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
            </Icon>
          </HStack>

          <Collapse in={showPorts}>
            <VStack align="stretch" spacing={3} p={3} pt={0}>
              {/* Inputs */}
              {Object.keys(inputs).length > 0 && (
                <Box>
                  <HStack spacing={1} mb={2}>
                    <Icon viewBox="0 0 24 24" w={3.5} h={3.5} color={tokens.colors.success}>
                      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </Icon>
                    <Text fontSize="11px" fontWeight="600" color={tokens.colors.text.secondary}>
                      Входы ({Object.keys(inputs).length})
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={1.5}>
                    {Object.entries(inputs).map(([key, schema]) => (
                      <Box
                        key={key}
                        p={2}
                        bg={tokens.colors.blur.light}
                        borderRadius={tokens.borderRadius.sm}
                        border="1px solid"
                        borderColor={tokens.colors.border.subtle}
                      >
                        <HStack justify="space-between" mb={0.5}>
                          <Text fontSize="11px" fontWeight="600" color={tokens.colors.text.primary}>
                            {key}
                          </Text>
                          {schema.required && (
                            <Badge fontSize="9px" colorScheme="red">
                              обяз.
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="10px" color={tokens.colors.text.tertiary}>
                          {schema.type || "any"}
                        </Text>
                        {schema.description && (
                          <Text fontSize="10px" color={tokens.colors.text.tertiary} mt={1}>
                            {schema.description}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Outputs */}
              {Object.keys(outputs).length > 0 && (
                <Box>
                  <HStack spacing={1} mb={2}>
                    <Icon viewBox="0 0 24 24" w={3.5} h={3.5} color={tokens.colors.warning}>
                      <path fill="currentColor" d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
                    </Icon>
                    <Text fontSize="11px" fontWeight="600" color={tokens.colors.text.secondary}>
                      Выходы ({Object.keys(outputs).length})
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={1.5}>
                    {Object.entries(outputs).map(([key, schema]) => (
                      <Box
                        key={key}
                        p={2}
                        bg={tokens.colors.blur.light}
                        borderRadius={tokens.borderRadius.sm}
                        border="1px solid"
                        borderColor={tokens.colors.border.subtle}
                      >
                        <Text
                          fontSize="11px"
                          fontWeight="600"
                          color={tokens.colors.text.primary}
                          mb={0.5}
                        >
                          {key}
                        </Text>
                        <Text fontSize="10px" color={tokens.colors.text.tertiary}>
                          {schema.type || "any"}
                        </Text>
                        {schema.description && (
                          <Text fontSize="10px" color={tokens.colors.text.tertiary} mt={1}>
                            {schema.description}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Collapse>
        </Box>

        {/* Configuration section */}
        {selectedNode.data.meta?.config_schema &&
          Object.keys(selectedNode.data.meta.config_schema).length > 0 && (
            <Box borderBottom="1px solid" borderColor={tokens.colors.border.subtle}>
              <HStack
                p={3}
                cursor="pointer"
                onClick={toggleConfig}
                _hover={{ bg: tokens.colors.blur.light }}
              >
                <Text fontSize="12px" fontWeight="600" color={tokens.colors.text.primary} flex={1}>
                  Конфигурация
                </Text>
                <Icon
                  viewBox="0 0 24 24"
                  w={4}
                  h={4}
                  color={tokens.colors.text.tertiary}
                  transform={showConfig ? "rotate(180deg)" : "rotate(0deg)"}
                  transition="transform 0.2s"
                >
                  <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
                </Icon>
              </HStack>

              <Collapse in={showConfig}>
                <Box p={3} pt={0}>
                  <ConfigEditor
                    configSchema={selectedNode.data.meta.config_schema}
                    configValues={configValues}
                    onChange={handleConfigChange}
                  />
                </Box>
              </Collapse>
            </Box>
          )}

        {/* Data editor */}
        <Box p={3}>
          <Text fontSize="12px" fontWeight="600" color={tokens.colors.text.primary} mb={2}>
            Данные (JSON)
          </Text>
          <Textarea
            value={dataJson}
            onChange={(e) => setDataJson(e.target.value)}
            placeholder="{}"
            rows={12}
            fontSize="11px"
            fontFamily="monospace"
            bg={tokens.colors.blur.light}
            border="1px solid"
            borderColor={jsonError ? tokens.colors.error : tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.sm}
            color={tokens.colors.text.primary}
            resize="vertical"
            _focus={{
              borderColor: jsonError ? tokens.colors.error : tokens.colors.brand.primary,
              boxShadow: jsonError
                ? `0 0 0 1px ${tokens.colors.error}`
                : `0 0 0 1px ${tokens.colors.brand.primary}`,
            }}
          />
          {jsonError && (
            <Text fontSize="10px" color={tokens.colors.error} mt={1}>
              {jsonError}
            </Text>
          )}
          <HStack spacing={2} mt={3}>
            <Button
              size="sm"
              bg={tokens.colors.brand.primary}
              color={tokens.colors.text.primary}
              borderRadius={tokens.borderRadius.sm}
              leftIcon={<CheckIcon />}
              _hover={{ bg: tokens.colors.brand.secondary }}
              onClick={handleSave}
              flex={1}
            >
              Применить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius={tokens.borderRadius.sm}
              leftIcon={<CloseIcon />}
              color={tokens.colors.text.tertiary}
              _hover={{ bg: tokens.colors.blur.mid }}
              onClick={handleCancel}
            >
              Отмена
            </Button>
          </HStack>
        </Box>
      </VStack>
    </MotionBox>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(PropertiesPanel);
