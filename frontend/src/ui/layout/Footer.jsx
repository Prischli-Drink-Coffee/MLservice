import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { PROJECT_NAME, PROJECT_VERSION, PROJECT_AUTHOR, CURRENT_YEAR } from "@constants";


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
          {PROJECT_NAME} | Version {PROJECT_VERSION}
        </Text>
        <Text fontSize="sm" color={useColorModeValue("text.muted", "text.muted")}>
          © {CURRENT_YEAR} {PROJECT_AUTHOR}. All rights reserved.
        </Text>
      </Flex>
    </Box>
  );
}

export default Footer;
