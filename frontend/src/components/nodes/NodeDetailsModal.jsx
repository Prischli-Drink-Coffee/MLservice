import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Tag,
  Wrap,
  WrapItem,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getCategoryConfig } from "../../utils/categoryHelpers";
import { Title, Body, Footnote } from "../common/Typography";

const MotionBox = motion(Box);

/**
 * NodeDetailsModal - модальное окно с полной спецификацией ноды
 */
const NodeDetailsModal = ({ node, isOpen, onClose }) => {
  if (!node) return null;

  const categoryConfig = getCategoryConfig(node.meta?.category);
  const inputPorts = Object.values(node.inputs || {});
  const outputPorts = Object.values(node.outputs || {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent
        bg={tokens.colors.blur.dark}
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor={tokens.colors.border.subtle}
        borderRadius={tokens.borderRadius.lg}
        maxH="85vh"
      >
        <ModalHeader pt={6} pb={4}>
          <VStack align="start" spacing={2}>
            <HStack spacing={3}>
              <Box
                p={3}
                borderRadius={tokens.borderRadius.md}
                bg={`${categoryConfig.color}15`}
                color={categoryConfig.color}
              >
                {categoryConfig.icon({ w: 6, h: 6 })}
              </Box>
              <VStack align="start" spacing={0}>
                <Title size="small">{node.meta?.name || node.type}</Title>
                <HStack spacing={2}>
                  <Footnote size="small" color={tokens.colors.text.tertiary}>
                    {node.type}
                  </Footnote>
                  <Badge colorScheme="purple" fontSize="10px">
                    v{node.meta?.version || "1.0"}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>

            {/* Tags */}
            <Wrap spacing={2} mt={2}>
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
              {node.meta?.tags?.map((tag) => (
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
            </Wrap>
          </VStack>
        </ModalHeader>

        <ModalCloseButton color={tokens.colors.text.secondary} />

        <ModalBody pb={6}>
          <VStack align="stretch" spacing={5}>
            {/* Description */}
            <Box>
              <Body size="medium" color={tokens.colors.text.secondary}>
                {node.meta?.description || "Описание отсутствует"}
              </Body>
            </Box>

            <Divider borderColor={tokens.colors.border.subtle} />

            {/* Inputs Section */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Icon viewBox="0 0 24 24" w={5} h={5} color={tokens.colors.success}>
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </Icon>
                <Title size="small">Входные параметры ({inputPorts.length})</Title>
              </HStack>

              {inputPorts.length === 0 ? (
                <Box
                  p={4}
                  bg={tokens.colors.blur.light}
                  borderRadius={tokens.borderRadius.md}
                  border="1px dashed"
                  borderColor={tokens.colors.border.subtle}
                >
                  <Footnote size="medium" color={tokens.colors.text.tertiary} textAlign="center">
                    Нет входных параметров
                  </Footnote>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {inputPorts.map((port, idx) => (
                    <MotionBox
                      key={port.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      p={4}
                      bg={tokens.colors.blur.light}
                      borderRadius={tokens.borderRadius.md}
                      border="1px solid"
                      borderColor={tokens.colors.border.subtle}
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <Text
                          fontSize={tokens.typography.body.medium}
                          fontWeight="600"
                          color={tokens.colors.text.primary}
                        >
                          {port.name}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            colorScheme={port.required ? "red" : "gray"}
                            fontSize="10px"
                            px={2}
                            py={0.5}
                          >
                            {port.required ? "обязательный" : "опциональный"}
                          </Badge>
                          <Badge colorScheme="blue" fontSize="10px" px={2} py={0.5}>
                            {port.type}
                          </Badge>
                        </HStack>
                      </HStack>
                      {port.description && (
                        <Footnote size="small" color={tokens.colors.text.secondary}>
                          {port.description}
                        </Footnote>
                      )}
                    </MotionBox>
                  ))}
                </VStack>
              )}
            </VStack>

            <Divider borderColor={tokens.colors.border.subtle} />

            {/* Outputs Section */}
            <VStack align="stretch" spacing={3}>
              <HStack spacing={2}>
                <Icon viewBox="0 0 24 24" w={5} h={5} color={tokens.colors.warning}>
                  <path fill="currentColor" d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
                </Icon>
                <Title size="small">Выходные параметры ({outputPorts.length})</Title>
              </HStack>

              {outputPorts.length === 0 ? (
                <Box
                  p={4}
                  bg={tokens.colors.blur.light}
                  borderRadius={tokens.borderRadius.md}
                  border="1px dashed"
                  borderColor={tokens.colors.border.subtle}
                >
                  <Footnote size="medium" color={tokens.colors.text.tertiary} textAlign="center">
                    Нет выходных параметров
                  </Footnote>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {outputPorts.map((port, idx) => (
                    <MotionBox
                      key={port.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      p={4}
                      bg={tokens.colors.blur.light}
                      borderRadius={tokens.borderRadius.md}
                      border="1px solid"
                      borderColor={tokens.colors.border.subtle}
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <Text
                          fontSize={tokens.typography.body.medium}
                          fontWeight="600"
                          color={tokens.colors.text.primary}
                        >
                          {port.name}
                        </Text>
                        <Badge colorScheme="blue" fontSize="10px" px={2} py={0.5}>
                          {port.type}
                        </Badge>
                      </HStack>
                      {port.description && (
                        <Footnote size="small" color={tokens.colors.text.secondary}>
                          {port.description}
                        </Footnote>
                      )}
                    </MotionBox>
                  ))}
                </VStack>
              )}
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NodeDetailsModal;
