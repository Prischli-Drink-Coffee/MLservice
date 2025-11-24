import React from "react";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";

function LoadingState({ label = "Loading..." }) {
  return (
    <Center py={10} w="full">
      <VStack spacing={3}>
        <Spinner size="lg" />
        <Text color="text.muted">{label}</Text>
      </VStack>
    </Center>
  );
}

export default LoadingState;
