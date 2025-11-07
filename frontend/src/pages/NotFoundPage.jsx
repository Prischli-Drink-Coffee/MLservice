import React from "react";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box textAlign="center" py={20}>
      <Stack spacing={4} align="center">
        <Heading size="2xl">404</Heading>
        <Text fontSize="lg" color="text.muted">
          Страница не найдена или перемещена.
        </Text>
        <Button colorScheme="brand" onClick={() => navigate("/graphs")}>
          На главную
        </Button>
      </Stack>
    </Box>
  );
}

export default NotFoundPage;
