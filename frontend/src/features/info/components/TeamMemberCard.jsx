import React from "react";
import { Avatar, Badge, Box, HStack, Icon, VStack } from "@chakra-ui/react";
import { FiGithub, FiLinkedin, FiMail, FiMapPin } from "react-icons/fi";
import { Body, Footnote, Title } from "../../../components/common/Typography";
import { borderRadius, colors, spacing } from "../../../theme/tokens";
import { MotionBox, MotionVStack } from "./motionPrimitives";

function SocialIcon({ icon, href, ...motionProps }) {
  if (!href) {
    return null;
  }

  return (
    <MotionBox
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.2, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      {...motionProps}
    >
      <Icon
        as={icon}
        boxSize={5}
        color={colors.text.secondary}
        _hover={{ color: colors.brand.primary }}
        transition="color 0.2s"
        cursor="pointer"
      />
    </MotionBox>
  );
}

function TeamMemberCard({ member, index }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      h="full"
    >
      <Box
        bg={colors.blur.medium}
        border="1px solid"
        borderColor={colors.border.default}
        borderRadius={borderRadius["2xl"]}
        p={{ base: spacing.xl, md: spacing["2xl"], lg: spacing["3xl"] }}
        position="relative"
        overflow="hidden"
        h="full"
        minH={{ base: "400px", md: "420px" }}
        backdropFilter="blur(20px)"
        transition="all 0.3s ease"
        _hover={{
          borderColor: colors.brand.primary,
          boxShadow: `0 0 40px ${colors.brand.primary}30, 0 0 80px ${colors.brand.secondary}20`,
        }}
      >
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="4px"
          bg={`linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.secondary}, ${colors.brand.tertiary})`}
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.4 }}
        />

        <VStack
          spacing={spacing.lg}
          align="center"
          w="full"
          paddingLeft={12}
          paddingRight={12}
          mt={12}
        >
          <MotionBox whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
            <Avatar
              name={member.name}
              size="xl"
              bg={`linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`}
              color={colors.text.primary}
              border="3px solid"
              borderColor={colors.border.default}
              boxShadow={`0 0 30px ${colors.brand.primary}40`}
            />
          </MotionBox>

          <VStack spacing={spacing.sm} align="center">
            <Title variant="small" fontSize="20px" textAlign="center">
              {member.name}
            </Title>
            <Badge
              bg={colors.blur.accent}
              color={colors.brand.primary}
              px={3}
              py={1}
              borderRadius={borderRadius.lg}
              fontSize="12px"
              fontWeight={500}
              border="1px solid"
              borderColor={colors.border.default}
            >
              {member.role}
            </Badge>
          </VStack>

          <Body
            variant="medium"
            color={colors.text.secondary}
            textAlign="center"
            fontSize={{ base: "13px", md: "14px" }}
            lineHeight="1.7"
            noOfLines={4}
          >
            {member.description}
          </Body>

          {member.location && (
            <HStack spacing={2} color={colors.text.tertiary}>
              <Icon as={FiMapPin} boxSize={4} />
              <Footnote variant="small" fontSize="12px">
                {member.location}
              </Footnote>
            </HStack>
          )}

          {member.work && (
            <Box
              bg={colors.blur.light}
              px={3}
              py={2}
              borderRadius={borderRadius.md}
              border="1px solid"
              borderColor={colors.border.default}
              w="full"
            >
              <Footnote
                variant="small"
                color={colors.text.tertiary}
                textAlign="center"
                fontSize="12px"
              >
                {member.work}
              </Footnote>
            </Box>
          )}

          <HStack spacing={3} pt={2}>
            <SocialIcon icon={FiGithub} href={member.github} />
            <SocialIcon icon={FiLinkedin} href={member.linkedin} whileHover={{ rotate: -5 }} />
            <SocialIcon icon={FiMail} href={member.email && `mailto:${member.email}`} />
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  );
}

export default TeamMemberCard;
