import React from "react";
import { Text, VStack } from "@chakra-ui/react";

function EmptyState({ title = "Nothing here yet", description }) {
  return (
    <VStack
      spacing={2}
      py={10}
      px={4}
      borderWidth="1px"
      borderRadius="lg"
      borderStyle="dashed"
      borderColor="borderSubtle"
    >
      <Text fontWeight="semibold" fontSize="lg">
        {title}
      </Text>
      {description && (
        <Text color="text.muted" textAlign="center">
          {description}
        </Text>
      )}
    </VStack>
  );
}

export default EmptyState;
