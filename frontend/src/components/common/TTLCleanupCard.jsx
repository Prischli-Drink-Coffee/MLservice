import React, { useState } from "react";
import { Badge, Button, HStack, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { WarningTwoIcon, CheckCircleIcon } from "@chakra-ui/icons";
import GlowingCard from "./GlowingCard";
import { cleanupExpiredDatasets } from "../../API";
import extractErrorInfo from "../../utils/errorHandler";
import { tokens, colors } from "../../theme/tokens";

function TTLCleanupCard({ canCleanup = false }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!canCleanup) return null;

  const runCleanup = async () => {
    setLoading(true);
    try {
      const resp = await cleanupExpiredDatasets({ limit: 100 });
      setResult(resp);
    } catch (e) {
      const { userMessage } = extractErrorInfo(e, { fallbackMessage: "Не удалось запустить очистку" });
      setResult({ error: userMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowingCard intensity="medium">
      <Stack spacing={5}>
        <HStack justify="space-between" align={{ base: "flex-start", md: "center" }} spacing={5} flexWrap="wrap">
          <Stack spacing={1} maxW={{ base: "full", md: "70%" }}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={colors.text.tertiary}>
              TTL очистка датасетов
            </Text>
            <Text fontSize="lg" fontWeight={600} color={colors.text.primary}>
              Удаляет просроченные датасеты и связанный контент согласно политике хранения
            </Text>
            <Text fontSize="sm" color={colors.text.secondary}>
              Действие доступно администраторам и запускается без остановки сервиса.
            </Text>
          </Stack>
          <Badge
            borderRadius={tokens.borderRadius.full}
            px={4}
            py={1}
            bg="rgba(255,255,255,0.1)"
            color={colors.text.primary}
            letterSpacing="0.1em"
          >
            ADMIN
          </Badge>
        </HStack>

        <HStack spacing={4} flexWrap="wrap">
          <Button
            size="sm"
            colorScheme="red"
            leftIcon={<WarningTwoIcon />}
            onClick={runCleanup}
            isLoading={loading}
          >
            Очистить просроченные
          </Button>
          <Text fontSize="sm" color={colors.text.secondary}>
            Сканирует до 100 последних записей и файлов из хранилища.
          </Text>
        </HStack>

        {result && (
          result.error ? (
            <HStack spacing={3} color="red.300">
              <Icon as={WarningTwoIcon} />
              <Text fontSize="sm">Ошибка: {result.error}</Text>
            </HStack>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {[
                { label: "Cutoff", value: result.cutoff ? new Date(result.cutoff).toLocaleString() : "—" },
                { label: "Удалено", value: result.deleted ?? "0" },
                { label: "Файлов очищено", value: result.files_removed ?? "0" },
                { label: "Файлов не найдено", value: result.files_missing ?? "0" },
              ].map((stat) => (
                <Stack
                  key={stat.label}
                  spacing={1}
                  p={3}
                  borderRadius={tokens.borderRadius.lg}
                  bg="rgba(255,255,255,0.02)"
                  border="1px solid rgba(255,255,255,0.06)"
                >
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.1em" color={colors.text.tertiary}>
                    {stat.label}
                  </Text>
                  <HStack spacing={2} color={colors.text.primary}>
                    <Icon as={CheckCircleIcon} w={3} h={3} color={colors.text.secondary} />
                    <Text fontWeight={600} fontSize="sm" noOfLines={2}>
                      {stat.value}
                    </Text>
                  </HStack>
                </Stack>
              ))}
            </SimpleGrid>
          )
        )}
      </Stack>
    </GlowingCard>
  );
}

export default TTLCleanupCard;
