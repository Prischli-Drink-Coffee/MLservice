import { Box, Container, HStack, Icon, Link, SimpleGrid, Stack, Text, Button } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { FaGithub, FaVk } from "react-icons/fa";
import {
  PROJECT_NAME,
  PROJECT_VERSION,
  PROJECT_AUTHOR,
  CURRENT_YEAR,
  ORG_GITHUB_URL,
  ORG_VK_URL,
  SUPPORT_EMAIL,
} from "@constants";
import { colors, gradients, borderRadius, spacing } from "@theme/tokens";

function Footer() {
  return (
    <Box as="footer" position="relative" mt="auto">
      <Box
        position="absolute"
        inset={0}
        bg={`linear-gradient(145deg, rgba(5,5,10,0.9), rgba(5,5,5,0.65)), ${gradients.midnightMesh}`}
        opacity={0.9}
      />
      <Box position="relative" borderTop="1px solid rgba(255,255,255,0.08)">
        <Container maxW="6xl" py={6} px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Stack spacing={1}>
              <Text
                fontSize="xs"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.12em"
              >
                {PROJECT_NAME}
              </Text>
              <Text fontSize="md" fontWeight="semibold">
                Версия {PROJECT_VERSION}
              </Text>
              <Text fontSize="xs" color={colors.text.tertiary}>
                © {CURRENT_YEAR} {PROJECT_AUTHOR}. Все права защищены.
              </Text>
            </Stack>

            <Stack spacing={1}>
              <Text
                fontSize="xs"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.12em"
              >
                Контакты
              </Text>
              <Text fontSize="xs">Email: {SUPPORT_EMAIL}</Text>
              <HStack spacing={2}>
                <Link
                  href={ORG_GITHUB_URL}
                  aria-label="Organization GitHub"
                  isExternal
                  borderRadius={borderRadius.full}
                  border="1px solid rgba(255,255,255,0.12)"
                  p={2}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ borderColor: colors.brand.primary, color: colors.brand.primary }}
                  _focusVisible={{
                    boxShadow: `0 0 0 4px ${colors.brand.primary}33`,
                    outline: "none",
                  }}
                >
                  <Icon as={FaGithub} boxSize={3} />
                </Link>
                <Link
                  href={ORG_VK_URL}
                  aria-label="Organization VK"
                  isExternal
                  borderRadius={borderRadius.full}
                  border="1px solid rgba(255,255,255,0.12)"
                  p={2}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ borderColor: colors.brand.primary, color: colors.brand.primary }}
                  _focusVisible={{
                    boxShadow: `0 0 0 4px ${colors.brand.primary}33`,
                    outline: "none",
                  }}
                >
                  <Icon as={FaVk} boxSize={3} />
                </Link>
              </HStack>
            </Stack>

            <Stack spacing={1}>
              <Text
                fontSize="xs"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.12em"
                textAlign={"center"}
              >
                Документы
              </Text>
              <Button as={NavLink} to="/documents" size="sm" variant="ghost" color={colors.brand.primary}>
                Посмотреть документы
              </Button>
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}

export default Footer;
