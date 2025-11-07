import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import JsonEditor from "../common/JsonEditor";

function GraphExecutionModal({ isOpen, onClose, onExecute }) {
  const toast = useToast();
  const [inputJson, setInputJson] = useState("{}");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setIsLoading(false);
      setInputJson("{}");
    }
  }, [isOpen]);

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      let parsed = null;
      if (inputJson && inputJson.trim()) {
        parsed = JSON.parse(inputJson);
      }
      const response = await onExecute(parsed);
      setResult(response);
      toast({ title: "Execution started", status: "success" });
    } catch (error) {
      toast({ title: "Failed to execute graph", description: error.message, status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Execute graph</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <JsonEditor
              value={inputJson}
              onChange={setInputJson}
              placeholder={'{\n  "input": "value"\n}'}
            />
            {result && (
              <VStack align="stretch" spacing={1}>
                <Text fontWeight="semibold">Execution queued</Text>
                <Text fontSize="sm" color="text.muted">
                  Execution ID: {result.id}
                </Text>
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="brand" onClick={handleExecute} isLoading={isLoading}>
            Run
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default GraphExecutionModal;
