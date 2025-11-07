import React from "react";
import { Badge, Icon, Tooltip } from "@chakra-ui/react";
import { FiPlay, FiPause, FiSquare, FiAlertTriangle, FiLoader } from "react-icons/fi";
import { motion } from "framer-motion";

const MotionBadge = motion(Badge);

const STATUS_CONFIG = {
  RUNNING: {
    label: "Работает",
    colorScheme: "green",
    icon: FiPlay,
    tooltip: "Бот активен и обрабатывает сообщения",
  },
  PAUSED: {
    label: "На паузе",
    colorScheme: "yellow",
    icon: FiPause,
    tooltip: "Бот приостановлен, webhook активен",
  },
  STOPPED: {
    label: "Остановлен",
    colorScheme: "gray",
    icon: FiSquare,
    tooltip: "Бот остановлен полностью",
  },
  ERROR: {
    label: "Ошибка",
    colorScheme: "red",
    icon: FiAlertTriangle,
    tooltip: "Произошла ошибка в работе бота",
  },
  STARTING: {
    label: "Запускается",
    colorScheme: "blue",
    icon: FiLoader,
    tooltip: "Бот в процессе запуска",
  },
};

export default function BotStatusBadge({ status, showIcon = true, animated = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.STOPPED;

  const badgeContent = (
    <MotionBadge
      colorScheme={config.colorScheme}
      display="flex"
      alignItems="center"
      gap={1}
      px={2}
      py={1}
      borderRadius="md"
      fontWeight="medium"
      fontSize="xs"
      animate={
        animated && status === "STARTING"
          ? {
              scale: [1, 1.05, 1],
            }
          : {}
      }
      transition={{
        duration: 1.5,
        repeat: status === "STARTING" ? Infinity : 0,
        ease: "easeInOut",
      }}
    >
      {showIcon && (
        <Icon
          as={config.icon}
          boxSize={3}
          {...(status === "STARTING" && {
            as: motion(config.icon),
            animate: { rotate: 360 },
            transition: { duration: 2, repeat: Infinity, ease: "linear" },
          })}
        />
      )}
      {config.label}
    </MotionBadge>
  );

  return (
    <Tooltip
      label={config.tooltip}
      placement="top"
      bg="gray.700"
      color="white"
      borderRadius="md"
      px={3}
      py={2}
      fontSize="sm"
    >
      {badgeContent}
    </Tooltip>
  );
}
