import React from "react";
import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";

function Footer() {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderColor={useColorModeValue("borderSubtle", "borderSubtle")}
      bg={useColorModeValue("surface", "surface")}
      py={4}
      px={6}
      mt="auto"
    >
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={2}>
        <Text fontSize="sm" color={useColorModeValue("text.muted", "text.muted")}>
          TeleRAG Platform | Version 1.0.0
        </Text>
        <Text fontSize="sm" color={useColorModeValue("text.muted", "text.muted")}>
          © {new Date().getFullYear()} Prischli-Drink-Coffee Team. All rights reserved.
        </Text>
      </Flex>
    </Box>
  );
}

export default Footer;
