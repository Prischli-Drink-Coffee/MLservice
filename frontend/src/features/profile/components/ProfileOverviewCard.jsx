import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { FiMail } from "react-icons/fi";
import GlowingCard from "@ui/molecules/GlowingCard";
import PrimaryButton from "@ui/atoms/PrimaryButton";
import { colors, borderRadius, spacing, gradients } from "@theme/tokens";

function Field({ label, value }) {
  return (
    <Stack
      spacing={1}
      p={4}
      borderRadius={borderRadius.lg}
      border="1px solid rgba(255,255,255,0.08)"
      bg="rgba(6,8,15,0.85)"
      position="relative"
      overflow="hidden"
      minW={{ base: "full", md: "220px" }}
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        background: gradients.dusk,
        opacity: 0.4,
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: "4px",
        borderRadius: `calc(${borderRadius.lg} - 6px)`,
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <Text
        fontSize="10px"
        textTransform="uppercase"
        letterSpacing="0.2em"
        color={colors.text.tertiary}
        position="relative"
        zIndex={1}
      >
        {label}
      </Text>
      <Text
        fontWeight={600}
        fontSize="md"
        color={value ? colors.text.primary : colors.text.tertiary}
        position="relative"
        zIndex={1}
      >
        {value || "—"}
      </Text>
    </Stack>
  );
}

function ProfileOverviewCard({ profile, onEdit }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!profile) return null;

  const formattedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "—";

  return (
    <GlowingCard intensity="strong">
      <Stack spacing={{ base: 6, md: 7 }}>
        <Box
          borderRadius={borderRadius.xl}
          p={{ base: spacing.md, md: spacing.lg }}
          bg="rgba(6,8,15,0.85)"
          border="1px solid rgba(255,255,255,0.08)"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-35%",
            background: gradients.aurora,
            opacity: 0.25,
            filter: "blur(80px)",
            animation: prefersReducedMotion ? "none" : "gradientOrbit 26s linear infinite",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: "1px",
            borderRadius: `calc(${borderRadius.xl} - 8px)`,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(125deg, rgba(255,255,255,0.08), transparent 55%)",
            opacity: 0.65,
            pointerEvents: "none",
          }}
        >
          <HStack
            spacing={4}
            align="center"
            justify="space-between"
            flexWrap="wrap"
            position="relative"
            zIndex={1}
          >
            <HStack spacing={4} align="center">
              <Box position="relative">
                <Avatar
                  name={profile.first_name || profile.email}
                  src={profile.avatar_url || undefined}
                  size="lg"
                  border="2px solid rgba(255,255,255,0.18)"
                />
                <Box
                  position="absolute"
                  inset={-2}
                  borderRadius="full"
                  border="1px solid rgba(255,255,255,0.18)"
                  opacity={0.4}
                />
              </Box>
              <Stack spacing={2}>
                <HStack spacing={3} align="center" wrap="wrap">
                  <Text fontSize="xl" fontWeight="bold">
                    {profile.first_name || "Новый пользователь"}
                  </Text>
                  <Badge
                    bg="transparent"
                    color="#6ee7b7"
                    border="1px solid rgba(16,185,129,0.4)"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="0.65rem"
                    letterSpacing="0.18em"
                    textTransform="uppercase"
                  >
                    Аккаунт активен
                  </Badge>
                </HStack>
                <HStack
                  spacing={2}
                  color={colors.text.secondary}
                  fontSize="sm"
                  bg="rgba(255,255,255,0.04)"
                  px={3}
                  py={2}
                  borderRadius={borderRadius.lg}
                  border="1px solid rgba(255,255,255,0.05)"
                >
                  <Icon as={FiMail} />
                  <Text>{profile.email}</Text>
                </HStack>
              </Stack>
            </HStack>
            <PrimaryButton size="sm" onClick={onEdit} minW={{ base: "full", md: "auto" }}>
              Редактировать
            </PrimaryButton>
          </HStack>
        </Box>

        <Divider borderColor="rgba(255,255,255,0.08)" />

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 3, md: 4 }}>
          <Field label="Компания" value={profile.company} />
          <Field label="Часовой пояс" value={profile.timezone || "UTC"} />
          <Field label="Дата регистрации" value={formattedDate} />
          <Field label="Роль" value={profile.role || "Пользователь"} />
          <Field label="Телефон" value={profile.phone} />
          <Field label="ID профиля" value={profile.id} />
        </SimpleGrid>
      </Stack>
    </GlowingCard>
  );
}

export default ProfileOverviewCard;
