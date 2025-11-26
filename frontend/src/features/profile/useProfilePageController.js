import { useCallback, useMemo, useState } from "react";
import { useToast } from "@chakra-ui/react";
import useProfile from "../../hooks/useProfile";
import useQuotaPlans from "../../hooks/useQuotaPlans";
import { showErrorToast } from "@utils/errorHandler";
import { SUPPORT_EMAIL } from "@constants";

const isPaymentsUiEnabled =
  String(process.env.REACT_APP_ENABLE_PROFILE_PAYMENTS_UI || "true").toLowerCase() !== "false";

const RELATIVE_TIME_DIVISIONS = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
const absoluteFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  let durationInSeconds = (date.getTime() - Date.now()) / 1000;
  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(durationInSeconds) < division.amount) {
      return relativeFormatter.format(Math.round(durationInSeconds), division.unit);
    }
    durationInSeconds /= division.amount;
  }
  return "";
};

const formatTimelineTimestamp = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const absolute = absoluteFormatter.format(date);
  const relative = formatRelativeTime(date);
  return relative ? `${absolute} · ${relative}` : absolute;
};

const buildActivityItems = (profile, quota) => {
  if (!profile) return [];
  const events = [];

  if (profile.created_at) {
    events.push({
      id: `profile-created-${profile.created_at}`,
      title: "Регистрация аккаунта",
      description:
        `${profile.email} подключился к платформе` +
        (profile.company ? ` (${profile.company})` : ""),
      timestamp: formatTimelineTimestamp(profile.created_at),
    });
  }

  if (profile.updated_at && profile.updated_at !== profile.created_at) {
    events.push({
      id: `profile-updated-${profile.updated_at}`,
      title: "Профиль обновлён",
      description: "Данные аккаунта были изменены",
      timestamp: formatTimelineTimestamp(profile.updated_at),
    });
  }

  if (quota?.resets_at) {
    events.push({
      id: `quota-reset-${quota.resets_at}`,
      title: "Сброс квоты",
      description: quota.limit
        ? `Лимит вернётся к ${quota.limit.toLocaleString()} токенам`
        : "Лимит будет обновлён",
      timestamp: formatTimelineTimestamp(quota.resets_at),
    });
  }

  if (typeof quota?.used === "number" && typeof quota?.limit === "number") {
    const percent = quota.limit
      ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
      : null;
    events.push({
      id: `quota-usage-${quota.used}`,
      title: "Использование квоты",
      description:
        percent != null
          ? `Израсходовано ${quota.used.toLocaleString()} из ${quota.limit.toLocaleString()} токенов (${percent}% квоты)`
          : `Израсходовано ${quota.used.toLocaleString()} токенов`,
      timestamp: formatTimelineTimestamp(profile.updated_at || profile.created_at),
    });
  }

  return events;
};

export default function useProfilePageController() {
  const toast = useToast();
  const { profile, quota, isLoading, error, refresh, update, isSaving } = useProfile();
  const { plans, isLoading: isPlansLoading, loadPlans } = useQuotaPlans();

  const [isEditOpen, setEditOpen] = useState(false);
  const [isPlansOpen, setPlansOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    refresh().catch((err) => {
      showErrorToast(toast, err, { title: "Не удалось обновить профиль" });
    });
  }, [refresh, toast]);

  const handleEditSubmit = useCallback(
    async (payload) => {
      await update(payload);
    },
    [update],
  );

  const openPlans = useCallback(() => {
    setPlansOpen(true);
    if (plans.length === 0) {
      loadPlans().catch((err) => {
        showErrorToast(toast, err, { title: "Не удалось загрузить планы" });
      });
    }
  }, [plans.length, loadPlans, toast]);

  const quotaWarning = useMemo(() => {
    if (!quota) {
      return null;
    }
    const threshold = quota.limit ? Math.round(quota.limit * 0.3) : 0;
    if (quota.available > Math.max(3, threshold)) {
      return null;
    }
    return { remaining: quota.available };
  }, [quota]);

  const activity = useMemo(() => buildActivityItems(profile, quota), [profile, quota]);

  return {
    profile,
    quota,
    plans,
    activity,
    isLoading,
    error,
    isSaving,
    isPlansLoading,
    isEditOpen,
    isPlansOpen,
    supportEmail: SUPPORT_EMAIL,
    quotaWarning,
    isPaymentsUiEnabled,
    handleRefresh,
    handleEditSubmit,
    openEdit: () => setEditOpen(true),
    closeEdit: () => setEditOpen(false),
    openPlans,
    closePlans: () => setPlansOpen(false),
    loadPlans,
  };
}
