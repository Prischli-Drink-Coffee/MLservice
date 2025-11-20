import React from "react";
import { Text, VStack } from "@chakra-ui/react";

export default function StatTile({ label, value, accent, truncate = false }) {
  return (
    <VStack
      align="flex-start"
      spacing={1}
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor="whiteAlpha.200"
      bg="whiteAlpha.50"
    >
      <Text fontSize="xs" textTransform="uppercase" color="text.tertiary">
        {label}
      </Text>
      <Text
        fontWeight={600}
        color={accent || "text.primary"}
        fontSize="sm"
        noOfLines={truncate ? 1 : undefined}
        wordBreak={truncate ? "break-all" : "normal"}
      >
        {value ?? "—"}
      </Text>
    </VStack>
  );
}
