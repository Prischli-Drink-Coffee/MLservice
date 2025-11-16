import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";


const nameProject = "MLservice";
const versionProject = "1.0.0";
const authorProject = "Prischli-Drink-Coffee Team";
const yearCurrent = new Date().getFullYear();


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
          {nameProject} | Version {versionProject}
        </Text>
        <Text fontSize="sm" color={useColorModeValue("text.muted", "text.muted")}>
          © {yearCurrent} {authorProject}. All rights reserved.
        </Text>
      </Flex>
    </Box>
  );
}

export default Footer;
