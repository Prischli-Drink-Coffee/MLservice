import React from "react";
import { Box, Container, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Body, Title, Footnote } from "@ui/atoms/Typography";
import { borderRadius, colors, spacing } from "@theme/tokens";
import { MotionBox, MotionVStack } from "../motionPrimitives";

function AdvantagesSection({ advantages, title }) {
  return (
    <Box position="relative" zIndex={1} py={{ base: 16, md: 20 }}>
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <MotionVStack
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          spacing={{ base: spacing["8xl"], md: spacing["10xl"] }}
        >
          <VStack spacing={spacing["2xl"]} textAlign="center" maxW="900px" mb={{ base: 6, md: 8 }}>
            <Title variant="medium" fontSize={{ base: "28px", md: "36px" }}>
              {title}
            </Title>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={{ base: 8, md: 10, lg: 8 }}
            w="full"
            pt={{ base: 4, md: 6 }}
          >
            {advantages.map((feature, i) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Box
                  bg={colors.blur.medium}
                  border="1px solid"
                  borderColor={colors.border.default}
                  borderRadius={borderRadius.xl}
                  p={{ base: spacing["2xl"], md: spacing["3xl"], lg: spacing["4xl"] }}
                  h="full"
                  minH={{ base: "220px", md: "240px" }}
                  backdropFilter="blur(20px)"
                  transition="all 0.3s ease"
                  _hover={{
                    borderColor: colors.brand.primary,
                    boxShadow: `0 0 30px ${colors.brand.primary}20`,
                  }}
                >
                  <VStack
                    spacing={spacing.lg}
                    align="flex-start"
                    h="full"
                    px={{ base: 4, md: 12 }}
                    py={{ base: 6, md: 8 }}
                  >
                    <Text fontSize="28px" lineHeight="1">
                      {feature.title.split(" ")[0]}
                    </Text>
                    <Footnote
                      variant="large"
                      color={colors.text.primary}
                      fontWeight={600}
                      fontSize="16px"
                    >
                      {feature.title.split(" ").slice(1).join(" ")}
                    </Footnote>
                    <Body
                      variant="small"
                      color={colors.text.tertiary}
                      fontSize={{ base: "13px", md: "14px" }}
                      lineHeight="1.75"
                    >
                      {feature.description}
                    </Body>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionVStack>
      </Container>
    </Box>
  );
}

export default AdvantagesSection;
