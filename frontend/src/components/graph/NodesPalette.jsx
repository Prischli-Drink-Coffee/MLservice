import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Tooltip,
  Badge,
} from "@chakra-ui/react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getCategoryConfig, extractCategories } from "../../utils/categoryHelpers";

const MotionBox = motion(Box);

/**
 * NodePaletteItem - перетаскиваемая карточка ноды
 */
const NodePaletteItem = ({ node }) => {
  const category = node.meta?.category || "default";
  const categoryConfig = getCategoryConfig(category);
  const [isDragging, setIsDragging] = React.useState(false);
  const touchDataRef = React.useRef(null);

  const onDragStart = (event) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: node.type,
        meta: node.meta,
      }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // Touch event handlers for mobile drag-and-drop
  const onTouchStart = (event) => {
    setIsDragging(true);
    const touch = event.touches[0];

    // Store node data for touch drag
    touchDataRef.current = {
      type: node.type,
      meta: node.meta,
      startX: touch.clientX,
      startY: touch.clientY,
    };

    // Create a visual feedback element
    const dragImage = event.currentTarget.cloneNode(true);
    dragImage.style.position = "fixed";
    dragImage.style.pointerEvents = "none";
    dragImage.style.opacity = "0.8";
    dragImage.style.left = "-9999px";
    dragImage.id = "touch-drag-preview";
    document.body.appendChild(dragImage);
  };

  const onTouchMove = (event) => {
    if (!isDragging || !touchDataRef.current) return;

    event.preventDefault(); // Prevent scrolling while dragging
    const touch = event.touches[0];

    // Update visual feedback position
    const dragPreview = document.getElementById("touch-drag-preview");
    if (dragPreview) {
      dragPreview.style.left = `${touch.clientX - 50}px`;
      dragPreview.style.top = `${touch.clientY - 20}px`;
      dragPreview.style.transform = "scale(0.95)";
    }
  };

  const onTouchEnd = (event) => {
    if (!isDragging || !touchDataRef.current) return;

    setIsDragging(false);
    const touch = event.changedTouches[0];

    // Clean up drag preview
    const dragPreview = document.getElementById("touch-drag-preview");
    if (dragPreview) {
      dragPreview.remove();
    }

    // Find the React Flow canvas at touch position
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const reactFlowWrapper = targetElement?.closest(".react-flow__pane");

    if (reactFlowWrapper) {
      // Create and dispatch a custom event with node data
      const dropEvent = new CustomEvent("node-palette-drop", {
        detail: {
          nodeType: touchDataRef.current.type,
          nodeMeta: touchDataRef.current.meta,
          position: {
            x: touch.clientX,
            y: touch.clientY,
          },
        },
      });
      reactFlowWrapper.dispatchEvent(dropEvent);
    }

    touchDataRef.current = null;
  };

  return (
    <MotionBox
      draggable
      onDragStart={onDragStart}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      p={2.5}
      bg={tokens.colors.blur.light}
      borderRadius={tokens.borderRadius.md}
      border="1px solid"
      borderColor={tokens.colors.border.subtle}
      transition="all 0.2s"
      _hover={{
        borderColor: categoryConfig.color,
        boxShadow: `0 0 12px ${categoryConfig.color}30`,
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <HStack spacing={2}>
        <Box
          p={1.5}
          borderRadius={tokens.borderRadius.sm}
          bg={`${categoryConfig.color}15`}
          color={categoryConfig.color}
          flexShrink={0}
        >
          {categoryConfig.icon({ w: 4, h: 4 })}
        </Box>
        <VStack align="start" spacing={0} flex={1} minW={0}>
          <Tooltip label={node.meta?.name || node.type} placement="right" hasArrow>
            <Text fontSize="12px" fontWeight="600" color={tokens.colors.text.primary} noOfLines={1}>
              {node.meta?.name || node.type}
            </Text>
          </Tooltip>
          <Text
            fontSize="10px"
            color={tokens.colors.text.tertiary}
            noOfLines={1}
            fontFamily="monospace"
          >
            {node.type}
          </Text>
        </VStack>
        <Icon viewBox="0 0 24 24" w={4} h={4} color={tokens.colors.text.tertiary} flexShrink={0}>
          <path fill="currentColor" d="M9 3L5 7h3v7h2V7h3L9 3zm7 14h-3V7h-2v10H8l4 4 4-4z" />
        </Icon>
      </HStack>
    </MotionBox>
  );
};

/**
 * NodesPalette - боковая панель с доступными нодами
 * Drag & drop, группировка по категориям, поиск
 */
const NodesPalette = ({ nodes, isCollapsed, onToggleCollapse }) => {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract categories
  const categories = React.useMemo(() => {
    return extractCategories(Object.values(nodes || {}));
  }, [nodes]);

  // Group nodes by category
  const nodesByCategory = React.useMemo(() => {
    const nodesArray = Object.values(nodes || {});
    const filtered = debouncedSearch
      ? nodesArray.filter((node) => {
          const searchLower = debouncedSearch.toLowerCase();
          return (
            node.type.toLowerCase().includes(searchLower) ||
            node.meta?.name?.toLowerCase().includes(searchLower) ||
            node.meta?.description?.toLowerCase().includes(searchLower)
          );
        })
      : nodesArray;

    const grouped = {};
    filtered.forEach((node) => {
      const cat = node.meta?.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(node);
    });

    // Sort by category name
    return Object.keys(grouped)
      .sort()
      .reduce((acc, cat) => {
        acc[cat] = grouped[cat];
        return acc;
      }, {});
  }, [nodes, debouncedSearch]);

  if (isCollapsed) {
    return (
      <MotionBox
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        position="absolute"
        left={0}
        top="50%"
        transform="translateY(-50%)"
        zIndex={50}
      >
        <Tooltip label="Показать панель нод" placement="right">
          <IconButton
            icon={<ChevronRightIcon />}
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
            aria-label="Expand nodes palette"
          />
        </Tooltip>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ duration: 0.3 }}
      w="280px"
      h="full"
      bg={tokens.colors.blur.dark}
      backdropFilter="blur(20px)"
      borderRight="1px solid"
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
            Ноды
          </Text>
        </VStack>
        <Tooltip label="Свернуть панель" placement="right">
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={onToggleCollapse}
            size="sm"
            variant="ghost"
            color={tokens.colors.text.tertiary}
            _hover={{
              bg: tokens.colors.blur.mid,
              color: tokens.colors.brand.primary,
            }}
            aria-label="Collapse nodes palette"
          />
        </Tooltip>
      </HStack>

      {/* Search */}
      <Box p={3} borderBottom="1px solid" borderColor={tokens.colors.border.subtle}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color={tokens.colors.text.tertiary} w={3.5} h={3.5} />
          </InputLeftElement>
          <Input
            placeholder="Поиск нод..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg={tokens.colors.blur.light}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.sm}
            color={tokens.colors.text.primary}
            fontSize="12px"
            _placeholder={{ color: tokens.colors.text.tertiary }}
            _focus={{
              borderColor: tokens.colors.brand.primary,
              boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
            }}
          />
        </InputGroup>
      </Box>

      {/* Nodes list by category */}
      <Box
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
        <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
          {Object.entries(nodesByCategory).map(([category, catNodes]) => {
            const categoryConfig = getCategoryConfig(category);
            return (
              <AccordionItem key={category} border="none">
                <AccordionButton px={3} py={2.5} _hover={{ bg: tokens.colors.blur.light }}>
                  <HStack flex={1} spacing={2}>
                    <Box color={categoryConfig.color}>{categoryConfig.icon({ w: 4, h: 4 })}</Box>
                    <Text fontSize="12px" fontWeight="600" color={tokens.colors.text.primary}>
                      {categoryConfig.label}
                    </Text>
                    <Badge
                      fontSize="10px"
                      colorScheme="purple"
                      borderRadius={tokens.borderRadius.sm}
                    >
                      {catNodes.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={tokens.colors.text.tertiary} />
                </AccordionButton>
                <AccordionPanel px={2} py={2}>
                  <VStack align="stretch" spacing={2}>
                    {catNodes.map((node) => (
                      <NodePaletteItem key={node.type} node={node} />
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>

        {Object.keys(nodesByCategory).length === 0 && (
          <Box p={6} textAlign="center">
            <Text fontSize="12px" color={tokens.colors.text.tertiary}>
              Ноды не найдены
            </Text>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(NodesPalette);
