import React from "react";
import { Badge, Box, Container } from "@chakra-ui/react";
import { Body, Title } from "../../../../components/common/Typography";
import { borderRadius, colors, spacing } from "../../../../theme/tokens";
import { MotionBox, MotionVStack } from "../motionPrimitives";

function HeroSection({ description }) {
  return (
    <Box position="relative" zIndex={1} pt={{ base: 20, md: 28 }} pb={{ base: 16, md: 20 }}>
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }} paddingTop={20}>
        <MotionVStack
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          spacing={spacing["2xl"]}
          align="center"
          textAlign="center"
        >
          <MotionBox
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge
              bg={colors.blur.accent}
              color={colors.brand.primary}
              px={4}
              py={2}
              borderRadius={borderRadius.lg}
              fontSize="13px"
              fontWeight={500}
              border="1px solid"
              borderColor={colors.border.default}
            >
              О нашей команде
            </Badge>
          </MotionBox>

          <Title
            variant="large"
            fontSize={{ base: "36px", md: "48px", lg: "56px" }}
            lineHeight="1.2"
            maxW="900px"
            paddingTop={4}
          >
            Мы студенты
            <br />
            <Box as="span" color={colors.brand.primary}>
              НИУ ВШЭ
            </Box>
          </Title>

          <Body
            variant="large"
            fontSize={{ base: "16px", md: "18px" }}
            color={colors.text.secondary}
            maxW="800px"
            lineHeight="1.8"
          >
            {description}
          </Body>
        </MotionVStack>
      </Container>
    </Box>
  );
}

export default HeroSection;
