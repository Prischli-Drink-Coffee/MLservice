import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";

const emptyStructure = {
  nodes: [],
  edges: [],
};

function GraphFormDrawer({ isOpen, onClose, onSubmit, initialGraph }) {
  const isEdit = Boolean(initialGraph);
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
    nodesJson: JSON.stringify(emptyStructure.nodes, null, 2),
    edgesJson: JSON.stringify(emptyStructure.edges, null, 2),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialGraph) {
      setForm({
        name: initialGraph.name ?? "",
        description: initialGraph.description ?? "",
        is_active: initialGraph.is_active,
        nodesJson: JSON.stringify(initialGraph.nodes ?? emptyStructure.nodes, null, 2),
        edgesJson: JSON.stringify(initialGraph.edges ?? emptyStructure.edges, null, 2),
      });
    } else {
      setForm({
        name: "",
        description: "",
        is_active: true,
        nodesJson: JSON.stringify(emptyStructure.nodes, null, 2),
        edgesJson: JSON.stringify(emptyStructure.edges, null, 2),
      });
    }
  }, [initialGraph, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const parsedNodes = JSON.parse(form.nodesJson || "[]");
      const parsedEdges = JSON.parse(form.edgesJson || "[]");

      if (!Array.isArray(parsedNodes)) {
        throw new Error("Nodes JSON must be an array");
      }
      if (!Array.isArray(parsedEdges)) {
        throw new Error("Edges JSON must be an array");
      }

      const payload = {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        nodes: parsedNodes,
        edges: parsedEdges,
      };

      await onSubmit(payload);
      toast({ title: `Graph ${isEdit ? "updated" : "created"}`, status: "success" });
      onClose();
    } catch (error) {
      toast({ title: "Failed to submit graph", description: error.message, status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit}>
        <DrawerCloseButton />
        <DrawerHeader>{isEdit ? "Edit graph" : "Create graph"}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Telegram onboarding"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Short description"
              />
            </FormControl>

            <Checkbox
              isChecked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            >
              Active graph
            </Checkbox>

            <FormControl>
              <FormLabel>Nodes JSON</FormLabel>
              <Textarea
                fontFamily="mono"
                minH="180px"
                value={form.nodesJson}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nodesJson: event.target.value }))
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Edges JSON</FormLabel>
              <Textarea
                fontFamily="mono"
                minH="180px"
                value={form.edgesJson}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, edgesJson: event.target.value }))
                }
              />
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="brand" isLoading={isLoading}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default GraphFormDrawer;
