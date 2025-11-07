import React from "react";
import { Alert, AlertDescription, AlertIcon, AlertTitle, CloseButton } from "@chakra-ui/react";

function ErrorAlert({ title = "Something went wrong", description, onClose }) {
  if (!description) return null;

  return (
    <Alert status="error" borderRadius="md" mb={4}>
      <AlertIcon />
      <AlertTitle mr={2}>{title}</AlertTitle>
      <AlertDescription flex="1">{description}</AlertDescription>
      {onClose && <CloseButton onClick={onClose} position="relative" right={-1} top={-1} />}
    </Alert>
  );
}

export default ErrorAlert;
