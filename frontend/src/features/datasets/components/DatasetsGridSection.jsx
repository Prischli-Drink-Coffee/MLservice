import PropTypes from "prop-types";
import { Box, SimpleGrid, usePrefersReducedMotion } from "@chakra-ui/react";
import { motion } from "framer-motion";
import GlowingCard from "../../../components/common/GlowingCard";
import { EmptyState, ErrorAlert, LoadingState } from "../../../components";
import DatasetCard from "../../../components/datasets/DatasetCard";
import { tokens } from "../../../theme/tokens";

const MotionTile = motion(Box);

function DatasetsGridSection({
  isInitialLoading,
  error,
  onDismissError,
  datasets,
  filteredDatasets,
  searchQuery,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const accentPalette = [
    tokens.colors.brand.primary,
    tokens.colors.brand.secondary,
    tokens.colors.brand.tertiary,
    "#f472b6",
    "#f59e0b",
  ];

  if (isInitialLoading) {
    return (
      <GlowingCard intensity="medium">
        <LoadingState label="Загружаем датасеты" />
      </GlowingCard>
    );
  }

  if (error) {
    return (
      <GlowingCard intensity="medium">
        <ErrorAlert description={error} onClose={onDismissError} />
      </GlowingCard>
    );
  }

  if (!datasets.length) {
    return (
      <GlowingCard intensity="medium">
        <EmptyState title="Нет датасетов" description="Загрузите CSV файл, чтобы начать обучение" />
      </GlowingCard>
    );
  }

  if (!filteredDatasets.length) {
    return (
      <GlowingCard intensity="medium">
        <EmptyState
          title="Ничего не найдено"
          description={`По запросу "${searchQuery}" датасеты не найдены`}
        />
      </GlowingCard>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 6 }} w="full">
      {filteredDatasets.map((dataset, index) => (
        <MotionTile
          key={dataset.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.05 }}
        >
          <DatasetCard
            dataset={dataset}
            onDownload={onDownload}
            onDelete={onDelete}
            isDownloading={downloadingId === dataset.id}
            isDeleting={deletingId === dataset.id}
            accentColor={accentPalette[index % accentPalette.length]}
          />
        </MotionTile>
      ))}
    </SimpleGrid>
  );
}

DatasetsGridSection.propTypes = {
  isInitialLoading: PropTypes.bool,
  error: PropTypes.string,
  onDismissError: PropTypes.func,
  datasets: PropTypes.arrayOf(PropTypes.object),
  filteredDatasets: PropTypes.arrayOf(PropTypes.object),
  searchQuery: PropTypes.string,
  onDownload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  downloadingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deletingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

DatasetsGridSection.defaultProps = {
  isInitialLoading: false,
  error: null,
  onDismissError: undefined,
  datasets: [],
  filteredDatasets: [],
  searchQuery: "",
  downloadingId: null,
  deletingId: null,
};

export default DatasetsGridSection;
