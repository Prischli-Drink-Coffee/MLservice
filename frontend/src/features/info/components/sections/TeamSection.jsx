import React from "react";
import { Box, Container, SimpleGrid, VStack } from "@chakra-ui/react";
import { Body, Title } from "../../../../components/common/Typography";
import { colors, spacing } from "../../../../theme/tokens";
import TeamMemberCard from "../TeamMemberCard";
import { MotionVStack } from "../motionPrimitives";

function TeamSection({ members }) {
  return (
    <Box position="relative" zIndex={1} py={{ base: 16, md: 20 }}>
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <MotionVStack
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          spacing={{ base: spacing["8xl"], md: spacing["10xl"] }}
        >
          <VStack spacing={spacing.xl} textAlign="center" mb={{ base: 4, md: 6 }}>
            <Title variant="medium" fontSize={{ base: "28px", md: "36px" }}>
              Наша команда
            </Title>
            <Body
              variant="medium"
              color={colors.text.tertiary}
              maxW="700px"
              fontSize={{ base: "14px", md: "16px" }}
            >
              Вот они — бездари бигтеха слева направо:
            </Body>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 8, md: 10, lg: 8 }} w="full" pt={{ base: 4, md: 6 }}>
            {members.map((member, index) => (
              <TeamMemberCard key={`${member.name}-${index}`} member={member} index={index} />
            ))}
          </SimpleGrid>
        </MotionVStack>
      </Container>
    </Box>
  );
}

export default TeamSection;
