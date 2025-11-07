import React, { useState, useCallback } from "react";
import { Box, HStack, VStack, Text, Tooltip, IconButton, Collapse } from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getCategoryConfig } from "../../utils/categoryHelpers";
import ConfigEditor from "./ConfigEditor";

const MotionBox = motion(Box);

const PortHandle = ({ id, type, position, tooltip, dimmed, emphasized, style }) => {
  const isInput = type === "target";
  const baseColor = isInput ? "#10b981" : "#f59e0b";

  return (
    <Tooltip
      label={tooltip}
      placement={isInput ? "left" : "right"}
      hasArrow={false}
      bg={tokens.colors.blur.dark}
      color={tokens.colors.text.primary}
      fontSize="11px"
      px={2}
      py={1}
      borderRadius={tokens.borderRadius.sm}
    >
      <Handle
        id={id}
        type={type}
        position={position}
        className="nodrag"
        style={{
          width: emphasized ? 14 : 12,
          height: emphasized ? 14 : 12,
          background: emphasized ? baseColor : dimmed ? "#64748b" : baseColor,
          border: `2px solid ${tokens.colors.background.darkPrimary}`,
          opacity: dimmed ? 0.4 : 1,
          boxShadow: emphasized ? `0 0 0 4px ${baseColor}40` : `0 0 8px ${baseColor}60`,
          transition: "all 0.2s",
          zIndex: 10,
          pointerEvents: "all",
          cursor: "crosshair",
          ...style,
        }}
      />
    </Tooltip>
  );
};

function CustomGraphNode({ data, selected, dragging, id }) {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  const nodeType = data?._rawType || data?.label || "default";
  const nodeName = data?.meta?.name || data?.label || nodeType;
  const nodeDescription = data?.meta?.description || nodeName;
  const category = data?.meta?.category || nodeType.split(".")[0] || "default";
  const categoryConfig = getCategoryConfig(category);

  const inputs = data?.__inputs || {};
  const outputs = data?.__outputs || {};
  const configSchema = data?.meta?.config_schema || {};
  const hasConfig = Object.keys(configSchema).length > 0;
  const configValues = data?._rawData || {};

  const highlightMode = data?.__highlightMode;
  const allowedTargets = data?.__allowedTargets || [];
  const allowedSources = data?.__allowedSources || [];
  const connecting = Boolean(data?.__connecting);
  const hasError = data?.__hasError;
  const hasWarning = data?.__hasWarning;

  const shouldAnimate = !dragging;

  const stopNodeDrag = useCallback((event) => {
    event.stopPropagation();
  }, []);

  const handleConfigChange = useCallback(
    (newConfig) => {
      if (data.onConfigChange) {
        data.onConfigChange(id, newConfig);
      }
    },
    [data, id],
  );

  return (
    <MotionBox
      whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
      transition={shouldAnimate ? { duration: 0.2 } : { duration: 0 }}
      position="relative"
      minW="200px"
      maxW={isConfigExpanded ? "420px" : "260px"}
      w="auto"
      style={{
        willChange: dragging ? "transform" : "auto",
      }}
    >
      {(hasError || hasWarning) && (
        <Box
          position="absolute"
          top={2}
          right={2}
          w={2}
          h={2}
          borderRadius="full"
          bg={hasError ? tokens.colors.error : tokens.colors.warning}
          boxShadow={`0 0 8px ${hasError ? tokens.colors.error : tokens.colors.warning}80`}
          zIndex={5}
        />
      )}

      <Box
        className="custom-node-body"
        bg={tokens.colors.blur.dark}
        backdropFilter={shouldAnimate ? "blur(20px)" : "none"}
        border="2px solid"
        borderColor={selected ? categoryConfig.color : `${categoryConfig.color}60`}
        borderRadius={tokens.borderRadius.md}
        boxShadow={
          selected && shouldAnimate ? `0 0 20px ${categoryConfig.color}60` : tokens.shadows.subtle
        }
        transition={shouldAnimate ? "all 0.2s" : "none"}
        overflow="visible"
      >
        <HStack p={3} pb={2} spacing={2} alignItems="flex-start">
          <Box
            p={1.5}
            borderRadius={tokens.borderRadius.sm}
            bg={`${categoryConfig.color}15`}
            color={categoryConfig.color}
            flexShrink={0}
          >
            {categoryConfig.icon({ w: 4, h: 4 })}
          </Box>
          <Tooltip
            label={nodeDescription}
            placement="top"
            hasArrow={false}
            bg={tokens.colors.blur.dark}
            color={tokens.colors.text.primary}
          >
            <Text
              fontSize="13px"
              fontWeight="600"
              color={tokens.colors.text.primary}
              noOfLines={2}
              lineHeight="1.2"
              flex={1}
            >
              {nodeName}
            </Text>
          </Tooltip>
          {hasConfig && (
            <IconButton
              size="xs"
              icon={isConfigExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setIsConfigExpanded((prev) => !prev)}
              variant="ghost"
              color={tokens.colors.text.tertiary}
              _hover={{ color: tokens.colors.brand.primary, bg: tokens.colors.blur.light }}
              aria-label="Toggle config"
            />
          )}
        </HStack>

        <Box px={3} pb={2}>
          <Text
            fontSize="10px"
            color={tokens.colors.text.tertiary}
            fontFamily="monospace"
            letterSpacing="-0.02em"
            noOfLines={1}
          >
            {nodeType}
          </Text>
        </Box>

        {hasConfig && (
          <Collapse in={isConfigExpanded} animateOpacity>
            <Box
              px={3}
              pb={2}
              borderTop="1px solid"
              borderColor={tokens.colors.border.subtle}
              pt={2}
              className="nodrag"
              onPointerDown={stopNodeDrag}
              onMouseDown={stopNodeDrag}
            >
              <Text
                fontSize="9px"
                fontWeight="600"
                color={tokens.colors.text.secondary}
                mb={2}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Конфигурация
              </Text>
              <Box maxH="300px" overflowY="auto" fontSize="10px">
                <ConfigEditor
                  configSchema={configSchema}
                  configValues={configValues}
                  onChange={handleConfigChange}
                />
              </Box>
            </Box>
          </Collapse>
        )}

        {Object.keys(inputs).length > 0 && (
          <VStack
            align="stretch"
            spacing={1}
            px={3}
            pb={2}
            borderTop="1px solid"
            borderColor={tokens.colors.border.subtle}
            pt={2}
          >
            {Object.entries(inputs).map(([key, schema]) => {
              const emphasized =
                connecting && highlightMode === "targets" && allowedTargets.includes(key);
              const dimmed =
                connecting && highlightMode === "targets" && !allowedTargets.includes(key);
              const baseColor = "#10b981";
              const dotColor = emphasized ? baseColor : dimmed ? "#475569" : baseColor;
              const dotShadow = emphasized
                ? `0 0 6px ${baseColor}80`
                : dimmed
                  ? "none"
                  : `0 0 4px ${baseColor}60`;

              return (
                <HStack
                  key={key}
                  spacing={2}
                  fontSize="10px"
                  alignItems="center"
                  minH="24px"
                  className="nodrag"
                  onPointerDown={stopNodeDrag}
                >
                  <Box position="relative" w="16px" h="16px" flexShrink={0}>
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={dotColor}
                      boxShadow={dotShadow}
                      pointerEvents="none"
                    />
                    <PortHandle
                      id={key}
                      type="target"
                      position={Position.Left}
                      tooltip={`${key}: ${schema.type || "any"}${schema.required ? " (обязательно)" : ""}`}
                      dimmed={dimmed}
                      emphasized={emphasized}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </Box>
                  <Text
                    color={tokens.colors.text.secondary}
                    flex={1}
                    whiteSpace="normal"
                    wordBreak="break-word"
                  >
                    {key}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        )}

        {Object.keys(outputs).length > 0 && (
          <VStack
            align="stretch"
            spacing={1}
            px={3}
            pb={2}
            borderTop="1px solid"
            borderColor={tokens.colors.border.subtle}
            pt={2}
          >
            {Object.entries(outputs).map(([key, schema]) => {
              const emphasized =
                connecting && highlightMode === "sources" && allowedSources.includes(key);
              const dimmed =
                connecting && highlightMode === "sources" && !allowedSources.includes(key);
              const baseColor = "#f97316";
              const dotColor = emphasized ? baseColor : dimmed ? "#475569" : baseColor;
              const dotShadow = emphasized
                ? `0 0 6px ${baseColor}80`
                : dimmed
                  ? "none"
                  : `0 0 4px ${baseColor}60`;
              return (
                <HStack
                  key={key}
                  spacing={2}
                  fontSize="10px"
                  alignItems="center"
                  minH="24px"
                  className="nodrag"
                  onPointerDown={stopNodeDrag}
                >
                  <Text
                    color={tokens.colors.text.secondary}
                    flex={1}
                    whiteSpace="normal"
                    wordBreak="break-word"
                  >
                    {key}
                  </Text>
                  <Box position="relative" w="16px" h="16px" flexShrink={0}>
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={dotColor}
                      boxShadow={dotShadow}
                      pointerEvents="none"
                    />
                    <PortHandle
                      id={key}
                      type="source"
                      position={Position.Right}
                      tooltip={`${key}: ${schema.type || "any"}`}
                      dimmed={dimmed}
                      emphasized={emphasized}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        )}
      </Box>
    </MotionBox>
  );
}

export default React.memo(CustomGraphNode);
