import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";

const MotionModalContent = motion(ModalContent);

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.7)" backdropFilter="blur(4px)" />
      <MotionModalContent
        bg={tokens.colors.blur.dark}
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor={tokens.colors.border.subtle}
        borderRadius={tokens.borderRadius.lg}
        color={tokens.colors.text.primary}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {title && (
          <ModalHeader
            fontSize={tokens.typography.subtitle.medium}
            borderBottom="1px solid"
            borderColor={tokens.colors.border.subtle}
            pb={3}
          >
            <VStack spacing={2} align="start">
              <Icon as={WarningIcon} w={6} h={6} color={tokens.colors.error} />
              {title}
            </VStack>
          </ModalHeader>
        )}
        <ModalBody py={6}>
          <Text fontSize={tokens.typography.body.medium} color={tokens.colors.text.secondary}>
            {message}
          </Text>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={tokens.colors.border.subtle} pt={3}>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            borderRadius={tokens.borderRadius.md}
            _hover={{
              bg: tokens.colors.blur.light,
            }}
          >
            Отмена
          </Button>
          <Button
            bg={tokens.colors.error}
            color="white"
            onClick={onConfirm}
            isLoading={isLoading}
            borderRadius={tokens.borderRadius.md}
            _hover={{
              bg: "#dc2626",
              transform: "scale(1.02)",
            }}
            _active={{
              transform: "scale(0.98)",
            }}
            transition="all 0.2s"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </MotionModalContent>
    </Modal>
  );
}

export default ConfirmDialog;
