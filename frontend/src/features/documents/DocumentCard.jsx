import React from "react";
import { Box, Heading, Text, Button, HStack, VStack } from "@chakra-ui/react";
import { colors, borderRadius, spacing, gradients, shadows } from "@theme/tokens";

export default function DocumentCard({ title, summary, href }) {
  return (
    <Box position="relative">
      <Box
        borderRadius={borderRadius.md}
        overflow="hidden"
        border={`1px solid ${colors.border.subtle}`}
        bg={colors.blur.mid}
        boxShadow={shadows.elevated}
      >
        <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }}>
          <HStack spacing={3} align="start" mb={3}>
            <Box
              w="10px"
              h="10px"
              borderRadius="3px"
              bgGradient={gradients.prism}
              boxShadow={shadows.glowSubtle}
              flexShrink={0}
            />
            <Heading as="h3" size="sm" color={colors.text.primary}>
              {title}
            </Heading>
          </HStack>

          <VStack align="stretch" spacing={3} mb={3}>
            <Text fontSize="sm" color={colors.text.tertiary} lineHeight="1.5">
              {summary}
            </Text>
          </VStack>

          <HStack spacing={3}>
            <Button
              as="a"
              href={href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="ghost"
              bgGradient={gradients.prism}
              _hover={{ transform: "translateY(-1px)", boxShadow: shadows.glowSubtle }}
            >
              Скачать
            </Button>
            <Button
              as="a"
              href={href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="outline"
            >
              Открыть
            </Button>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
}
