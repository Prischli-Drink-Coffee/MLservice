import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Tag,
  Icon,
  Wrap,
  WrapItem,
  Tooltip,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getCategoryConfig, countPorts } from "../../utils/categoryHelpers";
import { Body, Footnote } from "../common/Typography";

const MotionBox = motion(Box);

/**
 * NodeCard - компактная карточка ноды для реестра
 * Показывает основную информацию, при клике открывает детали
 */
const NodeCard = ({ node, onClick }) => {
  const categoryConfig = getCategoryConfig(node.meta?.category);
  const { inputs, outputs } = countPorts(node);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      position="relative"
      cursor="pointer"
      borderRadius={tokens.borderRadius.lg}
      bg={tokens.colors.blur.dark}
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor={isHovered ? categoryConfig.color : tokens.colors.border.subtle}
      p={5}
      transition="all 0.3s"
      overflow="hidden"
      _hover={{
        boxShadow: `0 0 20px ${categoryConfig.color}40`,
      }}
    >
      {/* Category colored accent on top */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bg={categoryConfig.color}
        opacity={isHovered ? 1 : 0.6}
        transition="opacity 0.3s"
      />

      {/* Header with icon and version */}
      <HStack justify="space-between" align="start" mb={3} spacing={3}>
        <HStack spacing={3} flex={1} minW={0}>
          <Box
            p={2}
            borderRadius={tokens.borderRadius.md}
            bg={`${categoryConfig.color}15`}
            color={categoryConfig.color}
            transition="all 0.3s"
            flexShrink={0}
          >
            {categoryConfig.icon({ w: 5, h: 5 })}
          </Box>
          <VStack align="start" spacing={0.5} flex={1} minW={0}>
            <Tooltip
              label={node.meta?.name || node.type}
              placement="top-start"
              hasArrow
              bg={tokens.colors.blur.dark}
              color={tokens.colors.text.primary}
              fontSize={tokens.typography.footnote.small}
              borderRadius={tokens.borderRadius.sm}
              px={3}
              py={2}
            >
              <Text
                fontSize={tokens.typography.body.medium}
                fontWeight="600"
                color={tokens.colors.text.primary}
                noOfLines={2}
                lineHeight="1.3"
                wordBreak="break-word"
              >
                {node.meta?.name || node.type}
              </Text>
            </Tooltip>
            <Tooltip
              label={node.type}
              placement="bottom-start"
              hasArrow
              bg={tokens.colors.blur.dark}
              color={tokens.colors.text.tertiary}
              fontSize={tokens.typography.footnote.small}
              borderRadius={tokens.borderRadius.sm}
              px={3}
              py={2}
            >
              <Text
                fontSize="10px"
                color={tokens.colors.text.tertiary}
                noOfLines={1}
                overflow="hidden"
                textOverflow="ellipsis"
                fontFamily="monospace"
                letterSpacing="-0.02em"
              >
                {node.type}
              </Text>
            </Tooltip>
          </VStack>
        </HStack>

        <Badge
          colorScheme="purple"
          fontSize="10px"
          px={2}
          py={1}
          borderRadius={tokens.borderRadius.sm}
          flexShrink={0}
          whiteSpace="nowrap"
        >
          v{node.meta?.version || "1.0"}
        </Badge>
      </HStack>

      {/* Description */}
      <Body size="small" color={tokens.colors.text.secondary} noOfLines={2} mb={3}>
        {node.meta?.description || "Описание отсутствует"}
      </Body>

      {/* Port counts */}
      <HStack spacing={3} mb={3}>
        <HStack spacing={1}>
          <Icon viewBox="0 0 24 24" w={4} h={4} color={tokens.colors.success}>
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </Icon>
          <Footnote size="small" color={tokens.colors.text.tertiary}>
            {inputs} input{inputs !== 1 ? "s" : ""}
          </Footnote>
        </HStack>

        <Box w="1px" h="12px" bg={tokens.colors.border.subtle} />

        <HStack spacing={1}>
          <Icon viewBox="0 0 24 24" w={4} h={4} color={tokens.colors.warning}>
            <path fill="currentColor" d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
          </Icon>
          <Footnote size="small" color={tokens.colors.text.tertiary}>
            {outputs} output{outputs !== 1 ? "s" : ""}
          </Footnote>
        </HStack>
      </HStack>

      {/* Tags - показываем при hover */}
      <MotionBox
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          height: isHovered ? "auto" : 0,
        }}
        transition={{ duration: 0.2 }}
        overflow="hidden"
      >
        <Wrap spacing={2} mb={2}>
          <WrapItem>
            <Tag
              size="sm"
              borderRadius={tokens.borderRadius.sm}
              bg={`${categoryConfig.color}20`}
              color={categoryConfig.color}
              border="1px solid"
              borderColor={`${categoryConfig.color}40`}
            >
              {categoryConfig.label}
            </Tag>
          </WrapItem>
          {node.meta?.tags?.slice(0, 3).map((tag) => (
            <WrapItem key={tag}>
              <Tag
                size="sm"
                borderRadius={tokens.borderRadius.sm}
                bg={tokens.colors.blur.light}
                color={tokens.colors.text.secondary}
              >
                {tag}
              </Tag>
            </WrapItem>
          ))}
          {node.meta?.tags?.length > 3 && (
            <WrapItem>
              <Tag size="sm" bg="transparent" color={tokens.colors.text.tertiary}>
                +{node.meta.tags.length - 3}
              </Tag>
            </WrapItem>
          )}
        </Wrap>
      </MotionBox>

      {/* Click hint */}
      <MotionBox
        position="absolute"
        bottom={3}
        right={3}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon viewBox="0 0 24 24" w={4} h={4} color={tokens.colors.text.tertiary}>
          <path
            fill="currentColor"
            d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
          />
        </Icon>
      </MotionBox>
    </MotionBox>
  );
};

export default NodeCard;
