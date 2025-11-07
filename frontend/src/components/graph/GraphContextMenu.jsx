import React from "react";
import { Box, Menu, MenuList, MenuItem, MenuDivider, Portal } from "@chakra-ui/react";
import { FiCopy, FiClipboard, FiTrash2, FiCrosshair, FiLayers } from "react-icons/fi";

/**
 * Context menu for graph canvas
 * @param {Object} props
 * @param {Object} props.position - Menu position {x, y}
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.selection - Current selection {nodes, edges}
 * @param {Function} props.onCopy - Copy handler
 * @param {Function} props.onCut - Cut handler
 * @param {Function} props.onPaste - Paste handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onDuplicate - Duplicate handler
 * @param {Function} props.onZoomToSelection - Zoom to selection handler
 * @param {boolean} props.hasClipboard - Whether clipboard has data
 */
export const GraphContextMenu = ({
  position,
  onClose,
  selection,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onZoomToSelection,
  hasClipboard,
}) => {
  const hasSelection = selection.nodes.length > 0 || selection.edges.length > 0;

  return (
    <Portal>
      <Box
        position="fixed"
        top={position.y}
        left={position.x}
        zIndex={9999}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Menu isOpen={true} onClose={onClose} closeOnBlur={true}>
          <MenuList bg="background.primary" borderColor="border.primary" shadow="xl" minW="200px">
            {hasSelection && (
              <>
                <MenuItem
                  icon={<FiCopy />}
                  onClick={() => {
                    onCopy();
                    onClose();
                  }}
                >
                  Копировать
                </MenuItem>
                <MenuItem
                  icon={<FiLayers />}
                  onClick={() => {
                    onDuplicate();
                    onClose();
                  }}
                >
                  Дублировать (Ctrl+D)
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<FiCrosshair />}
                  onClick={() => {
                    onZoomToSelection();
                    onClose();
                  }}
                >
                  Увеличить до выбранного
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<FiTrash2 />}
                  color="red.400"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                >
                  Удалить
                </MenuItem>
              </>
            )}
            {!hasSelection && hasClipboard && (
              <MenuItem
                icon={<FiClipboard />}
                onClick={() => {
                  onPaste();
                  onClose();
                }}
              >
                Вставить
              </MenuItem>
            )}
            {!hasSelection && !hasClipboard && <MenuItem isDisabled>Нет действий</MenuItem>}
          </MenuList>
        </Menu>
      </Box>
    </Portal>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(GraphContextMenu);
