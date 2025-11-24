import React from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import GlowingCard from "@ui/molecules/GlowingCard";
import { SUPPORT_EMAIL } from "@constants";

function PlanCard({ plan }) {
  const badgeScheme = plan.status === "coming_soon" ? "yellow" : "green";
  const cardBg = useColorModeValue("white", "surfaceElevated");

  return (
    <GlowingCard intensity="subtle" bg={cardBg}>
      <Stack spacing={3}>
        <HStack justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="lg">
            {plan.tokens} запусков
          </Text>
          <Badge colorScheme={badgeScheme} textTransform="capitalize">
            {plan.status.replace("_", " ")}
          </Badge>
        </HStack>
        <Text fontSize="3xl" fontWeight="black">
          ${plan.price}
          <Text as="span" fontSize="md" color="text.muted" ml={1}>
            {plan.currency}
          </Text>
        </Text>
        <Text color="text.muted" fontSize="sm">
          {plan.description}
        </Text>
      </Stack>
    </GlowingCard>
  );
}

function PurchaseQuotaModal({ isOpen, onClose, plans, isLoading, onReload }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Пакеты квот</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="info" borderRadius="md" mb={5}>
            <AlertIcon />
            <Stack spacing={0}>
              <AlertTitle>Онлайн-покупка скоро появится</AlertTitle>
              <AlertDescription>
                Напишите на <strong>{SUPPORT_EMAIL}</strong>, чтобы увеличить лимит вручную.
              </AlertDescription>
            </Stack>
          </Alert>

          {isLoading ? (
            <Stack py={6} align="center" spacing={3}>
              <Text color="text.muted">Загружаем варианты...</Text>
              <Button size="sm" isLoading loadingText="Загрузка" variant="ghost" />
            </Stack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </SimpleGrid>
          )}

          {plans.length === 0 && !isLoading && (
            <Stack spacing={3} textAlign="center" color="text.muted" py={6}>
              <Text>Пакеты ещё не загружены.</Text>
              <Button onClick={onReload} size="sm" alignSelf="center">
                Повторить загрузку
              </Button>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Закрыть
          </Button>
          <Button as="a" href={`mailto:${SUPPORT_EMAIL}`} colorScheme="brand">
            Написать в поддержку
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default PurchaseQuotaModal;
