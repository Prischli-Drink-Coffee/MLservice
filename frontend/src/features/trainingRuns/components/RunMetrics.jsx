import React from "react";
import { Stack, Text } from "@chakra-ui/react";

export default function RunMetrics({ metrics }) {
  if (!metrics) {
    return <Text color="text.muted">N/A</Text>;
  }

  if (metrics.task === "classification") {
    return (
      <Stack spacing={0} fontSize="sm">
        <Text>accuracy: {metrics.accuracy ?? "N/A"}</Text>
        {metrics.precision != null && <Text>precision: {metrics.precision}</Text>}
        {metrics.recall != null && <Text>recall: {metrics.recall}</Text>}
        {metrics.f1 != null && <Text>f1: {metrics.f1}</Text>}
      </Stack>
    );
  }

  if (metrics.task === "regression") {
    return (
      <Stack spacing={0} fontSize="sm">
        <Text>r2: {metrics.r2 ?? "N/A"}</Text>
        <Text>mse: {metrics.mse ?? "N/A"}</Text>
        {metrics.mae != null && <Text>mae: {metrics.mae}</Text>}
      </Stack>
    );
  }

  return <Text color="text.muted">N/A</Text>;
}
