import React from "react";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Stack } from "@chakra-ui/react";
import { colors, borderRadius } from "@theme/tokens";

function QuotaWarningAlert({ remaining }) {
  if (remaining == null) {
    return null;
  }

  return (
    <Alert
      status="warning"
      borderRadius={borderRadius.lg}
      bg="rgba(251,146,60,0.12)"
      border="1px solid rgba(251,146,60,0.4)"
      backdropFilter="blur(12px)"
      color={colors.text.primary}
    >
      <AlertIcon />
      <Stack spacing={0}>
        <AlertTitle fontWeight={700}>Квота почти исчерпана</AlertTitle>
        <AlertDescription color={colors.text.secondary}>
          Осталось {remaining} запусков. Подготовьте пополнение квоты или удалите старые задания.
        </AlertDescription>
      </Stack>
    </Alert>
  );
}

export default QuotaWarningAlert;
