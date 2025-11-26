import { Box, Container, HStack, Icon, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
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
        <Container maxW="6xl" py={10} px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Stack spacing={2}>
              <Text
                fontSize="sm"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.2em"
              >
                {PROJECT_NAME}
              </Text>
              <Text fontSize="lg" fontWeight="semibold">
                Версия {PROJECT_VERSION}
              </Text>
              <Text fontSize="xs" color={colors.text.tertiary}>
                © {CURRENT_YEAR} {PROJECT_AUTHOR}. Все права защищены.
              </Text>
            </Stack>

            <Stack spacing={2}>
              <Text
                fontSize="sm"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.2em"
              >
                Контакты
              </Text>
              <Text fontSize="sm">Email: {SUPPORT_EMAIL}</Text>
              <HStack spacing={3}>
                <Link
                  href={ORG_GITHUB_URL}
                  aria-label="Organization GitHub"
                  isExternal
                  borderRadius={borderRadius.full}
                  border="1px solid rgba(255,255,255,0.12)"
                  p={3}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ borderColor: colors.brand.primary, color: colors.brand.primary }}
                  _focusVisible={{
                    boxShadow: `0 0 0 4px ${colors.brand.primary}33`,
                    outline: "none",
                  }}
                >
                  <Icon as={FaGithub} boxSize={4} />
                </Link>
                <Link
                  href={ORG_VK_URL}
                  aria-label="Organization VK"
                  isExternal
                  borderRadius={borderRadius.full}
                  border="1px solid rgba(255,255,255,0.12)"
                  p={3}
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ borderColor: colors.brand.primary, color: colors.brand.primary }}
                  _focusVisible={{
                    boxShadow: `0 0 0 4px ${colors.brand.primary}33`,
                    outline: "none",
                  }}
                >
                  <Icon as={FaVk} boxSize={4} />
                </Link>
              </HStack>
            </Stack>

            <Stack spacing={2}>
              <Text
                fontSize="sm"
                color={colors.text.secondary}
                textTransform="uppercase"
                letterSpacing="0.2em"
              >
                Документы
              </Text>
              <Text fontSize="sm" color={colors.text.secondary}>
                Лицензионные соглашения и политика обработки данных доступны по запросу в поддержку.
              </Text>
              <Link href={`mailto:${SUPPORT_EMAIL}`} fontSize="sm" color={colors.brand.primary}>
                Запросить документы →
              </Link>
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}

export default Footer;
