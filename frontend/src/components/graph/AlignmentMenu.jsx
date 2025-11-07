import React from "react";
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  Tooltip,
} from "@chakra-ui/react";
import {
  MdAlignHorizontalLeft,
  MdAlignHorizontalCenter,
  MdAlignHorizontalRight,
  MdAlignVerticalTop,
  MdAlignVerticalCenter,
  MdAlignVerticalBottom,
} from "react-icons/md";
import { FiGrid, FiColumns, FiCreditCard } from "react-icons/fi";

/**
 * Alignment tools dropdown menu
 * @param {Object} props
 * @param {Function} props.onAlignLeft - Align left handler
 * @param {Function} props.onAlignCenter - Align center handler
 * @param {Function} props.onAlignRight - Align right handler
 * @param {Function} props.onAlignTop - Align top handler
 * @param {Function} props.onAlignMiddle - Align middle handler
 * @param {Function} props.onAlignBottom - Align bottom handler
 * @param {Function} props.onDistributeHorizontally - Distribute horizontally handler
 * @param {Function} props.onDistributeVertically - Distribute vertically handler
 * @param {boolean} props.disabled - Whether menu is disabled
 */
export const AlignmentMenu = ({
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onDistributeHorizontally,
  onDistributeVertically,
  disabled = false,
}) => {
  return (
    <Menu>
      <Tooltip label="Выравнивание нод" placement="bottom">
        <MenuButton
          as={IconButton}
          icon={<FiGrid />}
          variant="ghost"
          size="sm"
          isDisabled={disabled}
          aria-label="Alignment tools"
        />
      </Tooltip>
      <MenuList bg="background.primary" borderColor="border.primary" shadow="lg">
        <MenuGroup title="Горизонтальное выравнивание">
          <MenuItem icon={<MdAlignHorizontalLeft />} onClick={onAlignLeft}>
            По левому краю
          </MenuItem>
          <MenuItem icon={<MdAlignHorizontalCenter />} onClick={onAlignCenter}>
            По центру
          </MenuItem>
          <MenuItem icon={<MdAlignHorizontalRight />} onClick={onAlignRight}>
            По правому краю
          </MenuItem>
        </MenuGroup>
        <MenuDivider />
        <MenuGroup title="Вертикальное выравнивание">
          <MenuItem icon={<MdAlignVerticalTop />} onClick={onAlignTop}>
            По верхнему краю
          </MenuItem>
          <MenuItem icon={<MdAlignVerticalCenter />} onClick={onAlignMiddle}>
            По середине
          </MenuItem>
          <MenuItem icon={<MdAlignVerticalBottom />} onClick={onAlignBottom}>
            По нижнему краю
          </MenuItem>
        </MenuGroup>
        <MenuDivider />
        <MenuGroup title="Распределение">
          <MenuItem icon={<FiColumns />} onClick={onDistributeHorizontally}>
            Распределить по горизонтали
          </MenuItem>
          <MenuItem icon={<FiCreditCard />} onClick={onDistributeVertically}>
            Распределить по вертикали
          </MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(AlignmentMenu);
