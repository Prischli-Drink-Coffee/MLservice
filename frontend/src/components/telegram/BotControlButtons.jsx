import React from "react";
import { Button, ButtonGroup, Icon, Tooltip, useToast } from "@chakra-ui/react";
import { FiPlay, FiPause, FiSquare } from "react-icons/fi";
import { motion } from "framer-motion";
import { pauseBot, resumeBot, stopBot, botLifecycle } from "../../API/telegram";

const MotionButton = motion(Button);

export default function BotControlButtons({ bot, onStatusChange, size = "sm" }) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionType, setActionType] = React.useState(null);

  // Optimistic local state to immediately reflect UI changes
  const [localIsActive, setLocalIsActive] = React.useState(Boolean(bot.is_active));
  const [localJobStatus, setLocalJobStatus] = React.useState(bot.job_status || "STOPPED");

  React.useEffect(() => {
    setLocalIsActive(Boolean(bot.is_active));
    setLocalJobStatus(bot.job_status || "STOPPED");
  }, [bot.is_active, bot.job_status]);

  const handleAction = async (action, apiCall) => {
    setIsLoading(true);
    setActionType(action);
    // Show an informational toast immediately to indicate expected result
    const expectedLabels = {
      start: "Ожидается запуск бота...",
      pause: "Ожидается приостановка...",
      resume: "Ожидается возобновление...",
      stop: "Ожидается остановка бота...",
      restart: "Ожидается перезапуск...",
    };
    const infoToastId = `bot-action-${bot.id}-${action}`;
    toast.close(infoToastId);
    toast({
      id: infoToastId,
      title: expectedLabels[action] || "Выполняется действие",
      status: "info",
      duration: 3000,
    });
    try {
      await apiCall();
      toast.close(infoToastId);
      toast({
        title: `Готово: ${getActionLabel(action)}`,
        description: action === "start" ? "Webhook включен, ожидается запуск" : undefined,
        status: "success",
        duration: 3000,
      });
      if (onStatusChange) {
        await onStatusChange();
      }
      // Update optimistic local state to reflect the expected server-side result
      if (action === "start" || action === "resume") {
        setLocalIsActive(true);
        setLocalJobStatus("RUNNING");
      } else if (action === "pause") {
        setLocalJobStatus("PAUSED");
      } else if (action === "stop") {
        setLocalIsActive(false);
        setLocalJobStatus("STOPPED");
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      toast({
        title: "Ошибка",
        description: message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      start: "запущен",
      pause: "приостановлен",
      resume: "возобновлён",
      stop: "остановлен",
      restart: "перезапущен",
    };
    return labels[action] || "обновлён";
  };

  const jobStatus = localJobStatus || bot.job_status || "STOPPED";
  const isActive = localIsActive;

  return (
    <ButtonGroup size={size} isAttached variant="outline" spacing={0}>
      {/* Кнопка запуска - показываем если бот не активен или остановлен */}
      {(!isActive || jobStatus === "STOPPED") && (
        <Tooltip
          label="Запустить бота"
          placement="top"
          bg="gray.700"
          color="white"
          borderRadius="md"
          px={3}
          py={2}
          fontSize="sm"
        >
          <MotionButton
            leftIcon={<Icon as={FiPlay} />}
            colorScheme="green"
            onClick={() => handleAction("start", () => botLifecycle(bot.id, "activate"))}
            isLoading={isLoading && actionType === "start"}
            loadingText="Запуск..."
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Запустить
          </MotionButton>
        </Tooltip>
      )}

      {/* Кнопка паузы - показываем если бот работает */}
      {isActive && jobStatus === "RUNNING" && (
        <Tooltip
          label="Приостановить обработку сообщений"
          placement="top"
          bg="gray.700"
          color="white"
          borderRadius="md"
          px={3}
          py={2}
          fontSize="sm"
        >
          <MotionButton
            leftIcon={<Icon as={FiPause} />}
            colorScheme="yellow"
            onClick={() => handleAction("pause", () => pauseBot(bot.id))}
            isLoading={isLoading && actionType === "pause"}
            loadingText="Пауза..."
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Пауза
          </MotionButton>
        </Tooltip>
      )}

      {/* Кнопка возобновления - показываем если бот на паузе */}
      {isActive && jobStatus === "PAUSED" && (
        <Tooltip
          label="Возобновить обработку сообщений"
          placement="top"
          bg="gray.700"
          color="white"
          borderRadius="md"
          px={3}
          py={2}
          fontSize="sm"
        >
          <MotionButton
            leftIcon={<Icon as={FiPlay} />}
            colorScheme="blue"
            onClick={() => handleAction("resume", () => resumeBot(bot.id))}
            isLoading={isLoading && actionType === "resume"}
            loadingText="Возобновление..."
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Возобновить
          </MotionButton>
        </Tooltip>
      )}

      {/* Кнопка остановки - показываем если бот активен */}
      {isActive && jobStatus !== "STOPPED" && (
        <Tooltip
          label="Остановить бота полностью"
          placement="top"
          bg="gray.700"
          color="white"
          borderRadius="md"
          px={3}
          py={2}
          fontSize="sm"
        >
          <MotionButton
            leftIcon={<Icon as={FiSquare} />}
            colorScheme="red"
            onClick={() => handleAction("stop", () => stopBot(bot.id))}
            isLoading={isLoading && actionType === "stop"}
            loadingText="Остановка..."
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Остановить
          </MotionButton>
        </Tooltip>
      )}

      {/* Перезапуск удалён: кнопки старт/стоп/пауза/возобновление достаточно */}
    </ButtonGroup>
  );
}
