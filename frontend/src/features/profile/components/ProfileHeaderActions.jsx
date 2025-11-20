import React from "react";
import { Button, HStack } from "@chakra-ui/react";

function ProfileHeaderActions({ onRefresh, isLoading, onOpenPlans, isPaymentsEnabled }) {
  return (
    <HStack spacing={3}>
      <Button variant="ghost" size="sm" onClick={onRefresh} isLoading={isLoading}>
        Обновить
      </Button>
      {isPaymentsEnabled && (
        <Button colorScheme="brand" size="sm" onClick={onOpenPlans}>
          План квот
        </Button>
      )}
    </HStack>
  );
}

export default ProfileHeaderActions;
