import React from "react";
import { Box, Container, HStack, Icon, Tooltip } from "@chakra-ui/react";
import { FiGithub, FiMail } from "react-icons/fi";
import { Body, Title } from "@ui/atoms/Typography";
import { borderRadius, colors, spacing } from "@theme/tokens";
import { ORG_GITHUB_URL, ORG_VK_URL } from "@constants";
import { MotionBox, MotionVStack } from "../motionPrimitives";

function ContactSection() {
  return (
    <MotionVStack
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      spacing={spacing.lg}
      textAlign="center"
      pt={{ base: spacing["8xl"], md: spacing["10xl"], lg: spacing["10xl"] }}
      pb={{ base: spacing["6xl"], md: spacing["8xl"] }}
    >
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <Title variant="small" fontSize={{ base: "24px", md: "28px" }}>
          Появились вопросы?
        </Title>
        <Body
          variant="medium"
          color={colors.text.secondary}
          maxW="600px"
          fontSize={{ base: "14px", md: "16px" }}
          mx="auto"
        >
          Пишите в контакты организации github или напрямую разработчикам.
        </Body>
        <HStack spacing={4} pt={2} justify="center" flexWrap="wrap">
          {ORG_GITHUB_URL && (
            <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Tooltip label="Перейти в организацию на GitHub" aria-label="GitHub tooltip">
                <Box
                  as="a"
                  href={ORG_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open organization GitHub"
                  bg={colors.brand.primary}
                  color={colors.text.primary}
                  px={{ base: 4, md: 6 }}
                  py={{ base: 2, md: 3 }}
                  minW={{ base: "120px", md: "auto" }}
                  borderRadius={borderRadius.lg}
                  fontSize={{ base: "14px", md: "15px" }}
                  fontWeight={600}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  transition="all 0.2s"
                  _hover={{
                    bg: colors.brand.secondary,
                    boxShadow: `0 0 30px ${colors.brand.primary}40`,
                  }}
                >
                  <Icon as={FiGithub} boxSize={5} />
                  GitHub
                </Box>
              </Tooltip>
            </MotionBox>
          )}

          {ORG_VK_URL && (
            <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Tooltip label="Связаться с нами" aria-label="Contact tooltip">
                <Box
                  as="a"
                  href={ORG_VK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact organization"
                  bg={colors.blur.accent}
                  color={colors.text.primary}
                  px={{ base: 4, md: 6 }}
                  py={{ base: 2, md: 3 }}
                  minW={{ base: "120px", md: "auto" }}
                  borderRadius={borderRadius.lg}
                  fontSize={{ base: "14px", md: "15px" }}
                  fontWeight={600}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  border="1px solid"
                  borderColor={colors.border.default}
                  transition="all 0.2s"
                  _hover={{
                    borderColor: colors.brand.primary,
                    boxShadow: `0 0 20px ${colors.brand.primary}30`,
                  }}
                >
                  <Icon as={FiMail} boxSize={5} />
                  Связаться
                </Box>
              </Tooltip>
            </MotionBox>
          )}
        </HStack>
      </Container>
    </MotionVStack>
  );
}

export default ContactSection;
