import React from "react";
import { Box, Flex, Heading, HStack, Text, useColorModeValue } from "@chakra-ui/react";

function PageHeader({ title, subtitle, actions, right }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");
  return (
    <Box>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        mb={4}
        borderBottomWidth="1px"
        borderColor={borderColor}
        pb={3}
      >
        <Box>
          <Heading size="lg">{title}</Heading>
          {subtitle && (
            <Text color={subtitleColor} fontSize="sm">
              {subtitle}
            </Text>
          )}
        </Box>
        {actions ? <HStack spacing={3}>{actions}</HStack> : right}
      </Flex>
    </Box>
  );
}

export default PageHeader;
