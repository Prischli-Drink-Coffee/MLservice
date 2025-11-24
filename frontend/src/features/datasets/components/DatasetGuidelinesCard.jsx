import { Badge, Box, HStack, Icon, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import { InfoOutlineIcon, CheckCircleIcon } from "@chakra-ui/icons";
import PropTypes from "prop-types";
import GlowingCard from "@ui/molecules/GlowingCard";
import { tokens, colors } from "@theme/tokens";

function DatasetGuidelinesCard({ guidelines }) {
  const items = guidelines?.length ? guidelines : [
    "Максимальный размер файла — 200МБ",
    "Первая строка должна содержать названия колонок",
    "Используйте UTF-8 без BOM",
    "Числовые значения разделяются точкой",
  ];

  return (
    <GlowingCard intensity="medium">
      <Stack spacing={6} position="relative">
        <HStack justify="space-between" align="flex-start" spacing={4} flexWrap="wrap">
          <HStack spacing={3}>
            <Icon as={InfoOutlineIcon} w={5} h={5} color={colors.text.secondary} />
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
                Требования к CSV
              </Text>
              <Text fontSize="lg" fontWeight={600} color={colors.text.primary}>
                Проверьте файл перед загрузкой
              </Text>
            </VStack>
          </HStack>
          <Badge
            borderRadius={tokens.borderRadius.full}
            px={4}
            py={1}
            bg="rgba(47,116,255,0.18)"
            color={colors.text.primary}
            fontWeight={500}
            letterSpacing="0.08em"
          >
            STRICT MODE
          </Badge>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {items.map((guideline, index) => (
            <HStack
              key={`${guideline}-${index}`}
              align="flex-start"
              spacing={4}
              p={4}
              borderRadius={tokens.borderRadius.lg}
              bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.05)"
            >
              <Box
                w={10}
                h={10}
                borderRadius={tokens.borderRadius.lg}
                bg="rgba(47,116,255,0.12)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight={600}
                color={colors.text.primary}
              >
                {(index + 1).toString().padStart(2, "0")}
              </Box>
              <Text fontSize="sm" color={colors.text.secondary} lineHeight="1.5">
                {guideline}
              </Text>
            </HStack>
          ))}
        </SimpleGrid>

        <Box
          borderRadius={tokens.borderRadius.xl}
          border="1px solid rgba(255,255,255,0.08)"
          bg="rgba(255,255,255,0.02)"
          p={4}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={CheckCircleIcon} w={5} h={5} color={colors.text.secondary} />
            <VStack align="flex-start" spacing={1}>
              <Text fontWeight={600} color={colors.text.primary}>
                Прошли аудит качества
              </Text>
              <Text fontSize="sm" color={colors.text.secondary}>
                Сохраните консистентный формат колонок и избегайте пропусков — это ускорит генерацию профиля данных.
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Stack>
    </GlowingCard>
  );
}

DatasetGuidelinesCard.propTypes = {
  guidelines: PropTypes.arrayOf(PropTypes.string),
};

DatasetGuidelinesCard.defaultProps = {
  guidelines: [],
};

export default DatasetGuidelinesCard;
