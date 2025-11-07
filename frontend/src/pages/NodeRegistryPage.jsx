import React from "react";
import { Box, SimpleGrid, VStack, useDisclosure } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { LoadingState, ErrorAlert, EmptyState } from "../components";
import { getNodeRegistry } from "../API";
import { NodeCard, NodeDetailsModal, NodeSearchBar } from "../components/nodes";
import { Title } from "../components/common/Typography";
import { extractCategories, countPorts } from "../utils/categoryHelpers";
import { tokens } from "../theme/tokens";

const MotionBox = motion(Box);

function NodeRegistryPage() {
  const [registry, setRegistry] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [sortBy, setSortBy] = React.useState("name");
  const [selectedNode, setSelectedNode] = React.useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchRegistry = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getNodeRegistry();
      setRegistry(response);
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract categories from all nodes
  const categories = React.useMemo(() => {
    if (!registry?.nodes) return [];
    return extractCategories(Object.values(registry.nodes));
  }, [registry]);

  // Filter and sort nodes
  const nodes = React.useMemo(() => {
    if (!registry?.nodes) return [];

    let filtered = Object.values(registry.nodes);

    // Filter by search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (node) =>
          node.type.toLowerCase().includes(searchLower) ||
          node.meta?.name.toLowerCase().includes(searchLower) ||
          node.meta?.description.toLowerCase().includes(searchLower),
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((node) => node.meta?.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.meta?.name || a.type).localeCompare(b.meta?.name || b.type);
        case "category":
          return (a.meta?.category || "").localeCompare(b.meta?.category || "");
        case "inputs": {
          const aCount = countPorts(a).inputs;
          const bCount = countPorts(b).inputs;
          return bCount - aCount;
        }
        case "outputs": {
          const aCount = countPorts(a).outputs;
          const bCount = countPorts(b).outputs;
          return bCount - aCount;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [registry, debouncedSearch, selectedCategory, sortBy]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    onOpen();
  };

  if (isLoading && !registry) {
    return <LoadingState label="Загружаем реестр нод" />;
  }

  return (
    <VStack spacing={8} align="stretch" pb={12}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack align="start" spacing={2}>
          <Title size="large">Реестр нод</Title>
          <Box
            fontSize={tokens.typography.body.medium}
            color={tokens.colors.text.secondary}
            maxW="600px"
          >
            Просматривайте доступные типы нод, их входы и выходы, чтобы собирать графы
          </Box>
        </VStack>
      </MotionBox>

      {/* Error alert */}
      {error && <ErrorAlert description={error} onClose={() => setError(null)} />}

      {/* Search bar */}
      <NodeSearchBar
        searchValue={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultsCount={nodes.length}
      />

      {/* Nodes grid */}
      {!nodes.length && !isLoading ? (
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или фильтры"
          />
        </MotionBox>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5} w="full">
          {nodes.map((node, idx) => (
            <MotionBox
              key={node.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <NodeCard node={node} onClick={() => handleNodeClick(node)} />
            </MotionBox>
          ))}
        </SimpleGrid>
      )}

      {/* Details modal */}
      <NodeDetailsModal node={selectedNode} isOpen={isOpen} onClose={onClose} />
    </VStack>
  );
}

export default NodeRegistryPage;
