import React from "react";
import { Badge, Box, Flex, VStack } from "@chakra-ui/react";
import { borderRadius, colors, shadows, spacing } from "@theme/tokens";
import { MotionBox } from "@ui/motionPrimitives";
import Section from "@ui/atoms/Section";

function TechStackSection({ techStack }) {
  return (
    <Section pt={{ base: spacing["6xl"], md: spacing["8xl"] }}>
      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        w="full"
        mt={0}
        px={{ base: 0 }}
        py={{ base: 8, md: 12 }}
      >
        <Box
          bg={`linear-gradient(135deg, ${colors.blur.medium} 0%, ${colors.blur.light} 100%)`}
          border="1px solid"
          borderColor={colors.border.default}
          borderRadius={borderRadius["2xl"]}
          p={{ base: spacing["2xl"], md: spacing["4xl"] }}
          backdropFilter="blur(20px)"
          boxShadow={shadows.md}
        >
          <VStack spacing={spacing["2xl"]}>
            <Flex
              flexWrap="wrap"
              gap={3}
              justify="center"
              align="center"
              maxW="800px"
              py={6}
              margin="0 auto"
            >
              {techStack.map((tech, i) => (
                <MotionBox
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    bg={colors.blur.accent}
                    color={colors.text.primary}
                    px={{ base: 3, md: 4 }}
                    py={{ base: 1, md: 2 }}
                    borderRadius={borderRadius.lg}
                    fontSize="13px"
                    fontWeight={500}
                    border="1px solid"
                    borderColor={colors.border.default}
                    cursor="default"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: colors.brand.primary,
                      boxShadow: `0 0 20px ${colors.brand.primary}30`,
                    }}
                  >
                    {tech}
                  </Badge>
                </MotionBox>
              ))}
            </Flex>
          </VStack>
        </Box>
      </MotionBox>
    </Section>
  );
}

export default TechStackSection;
