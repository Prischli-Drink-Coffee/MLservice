import React from "react";
import { Box, HStack, Icon, Stack, Text, VStack, usePrefersReducedMotion } from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";
import GlowingCard from "@ui/molecules/GlowingCard";
import EmptyState from "@ui/molecules/EmptyState";
import { colors, borderRadius, gradients } from "@theme/tokens";

function ActivityTimeline({ items }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <GlowingCard intensity="medium">
      <Stack spacing={5}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Активность
          </Text>
          <Text fontSize="xs" color={colors.text.tertiary} letterSpacing="0.2em" textTransform="uppercase">
            обновляется каждые 60 сек
          </Text>
        </HStack>
        {items && items.length > 0 ? (
          <VStack align="stretch" spacing={4}>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <HStack key={item.id} align="flex-start" spacing={4}>
                  <Box position="relative" minH="80px" w="14px">
                    <Box
                      w="12px"
                      h="12px"
                      borderRadius="full"
                      border="1px solid rgba(255,255,255,0.4)"
                      background={gradients.prism}
                      boxShadow="0 0 20px rgba(47,116,255,0.45)"
                    />
                    {!isLast && (
                      <Box
                        position="absolute"
                        top="12px"
                        left="5px"
                        w="2px"
                        h="calc(100% - 12px)"
                        background="linear-gradient(180deg, rgba(255,255,255,0.4), transparent)"
                      />
                    )}
                  </Box>
                  <Stack
                    spacing={2}
                    flex="1"
                    p={4}
                    borderRadius={borderRadius.lg}
                    border="1px solid rgba(255,255,255,0.08)"
                    bg="rgba(6,8,15,0.9)"
                    position="relative"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: "absolute",
                      inset: "-40%",
                      background: gradients.midnightMesh,
                      opacity: 0.25,
                      filter: "blur(80px)",
                      animation: prefersReducedMotion ? "none" : "gradientOrbit 30s linear infinite",
                    }}
                  >
                    <Stack spacing={1} position="relative" zIndex={1}>
                      <Text fontWeight={600}>{item.title}</Text>
                      <Text color={colors.text.tertiary} fontSize="sm">
                        {item.description}
                      </Text>
                    </Stack>
                    <HStack spacing={2} color={colors.text.tertiary} fontSize="sm" position="relative" zIndex={1}>
                      <Icon as={FiClock} />
                      <Text>{item.timestamp}</Text>
                    </HStack>
                  </Stack>
                </HStack>
              );
            })}
          </VStack>
        ) : (
          <EmptyState
            title="История активности скоро появится"
            description="Мы готовим события запусков и загрузок. Пока что следите за квотами и получайте уведомления по email."
          />
        )}
      </Stack>
    </GlowingCard>
  );
}

export default ActivityTimeline;
