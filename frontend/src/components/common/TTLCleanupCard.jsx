import React, { useState } from "react";
import { Stack, Text, Button, HStack, Badge } from "@chakra-ui/react";
import Card from "./Card";
import { cleanupExpiredDatasets } from "../../API";

function TTLCleanupCard({ isAdmin = true }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const runCleanup = async () => {
    setLoading(true);
    try {
      const resp = await cleanupExpiredDatasets({ limit: 1000 });
      setResult(resp);
    } catch (e) {
      setResult({ error: e.response?.data?.detail || e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card p={4}>
      <Stack spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="semibold">TTL очистка датасетов</Text>
          <Badge colorScheme="purple" variant="outline">Admin</Badge>
        </HStack>
        <Text fontSize="sm" color="text.muted">
          Удаляет просроченные датасеты и связанные файлы согласно настройке TTL на бэкенде.
        </Text>
        <Button size="sm" colorScheme="red" onClick={runCleanup} isLoading={loading}>
          Очистить просроченные
        </Button>
        {result && (
          <Stack fontSize="xs" spacing={1} color={result.error ? "red.400" : "text.muted"}>
            {result.error ? (
              <Text>Ошибка: {result.error}</Text>
            ) : (
              <>
                <Text>cutoff: {new Date(result.cutoff).toLocaleString()}</Text>
                <Text>deleted: {result.deleted}</Text>
                <Text>files_removed: {result.files_removed}</Text>
                <Text>files_missing: {result.files_missing}</Text>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

export default TTLCleanupCard;
