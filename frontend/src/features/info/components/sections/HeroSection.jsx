import React from "react";
import { Badge, Box, Container } from "@chakra-ui/react";
import { Body, Title } from "@ui/atoms/Typography";
import { borderRadius, colors, spacing } from "@theme/tokens";
import { MotionBox, MotionVStack } from "../motionPrimitives";
import FeatureBadge from "@ui/atoms/FeatureBadge";

function HeroSection({ description }) {
  return (
    <Box position="relative" zIndex={1} pt={{ base: 10, md: 18 }} pb={{ base: 16, md: 20 }}>
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
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
            <FeatureBadge>
              О нашей команде
            </FeatureBadge>
          </MotionBox>

          <Title
            variant="large"
            fontSize={{ base: "36px", md: "48px", lg: "56px" }}
            lineHeight="1.2"
            maxW={{ base: "full", md: "900px" }}
            paddingTop={2}
            px={{ base: 4, md: 0 }}
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
