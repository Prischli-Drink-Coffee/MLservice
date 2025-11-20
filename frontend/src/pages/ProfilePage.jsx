import React from "react";
import { SimpleGrid, Stack } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import GlowingCard from "../components/common/GlowingCard";
import { EmptyState, ErrorAlert, LoadingState } from "../components";
import ProfileOverviewCard from "../components/profile/ProfileOverviewCard";
import ProfileEditDrawer from "../components/profile/ProfileEditDrawer";
import QuotaUsageCard from "../components/profile/QuotaUsageCard";
import ActivityTimeline from "../components/profile/ActivityTimeline";
import PurchaseQuotaModal from "../components/profile/PurchaseQuotaModal";
import useProfilePageController from "../features/profile/useProfilePageController";
import ProfileHeaderActions from "../features/profile/components/ProfileHeaderActions";
import ProfileSupportCard from "../features/profile/components/ProfileSupportCard";
import QuotaWarningAlert from "../features/profile/components/QuotaWarningAlert";

function ProfilePage() {
  const {
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
    supportEmail,
    quotaWarning,
    isPaymentsUiEnabled,
    handleRefresh,
    handleEditSubmit,
    openEdit,
    closeEdit,
    openPlans,
    closePlans,
    loadPlans,
  } = useProfilePageController();

  return (
    <Stack spacing={6} w="full">
      <PageHeader
        title="Профиль"
        subtitle="Редактируйте данные аккаунта и следите за квотами"
        actions={
          <ProfileHeaderActions
            onRefresh={handleRefresh}
            isLoading={isLoading}
            onOpenPlans={openPlans}
            isPaymentsEnabled={isPaymentsUiEnabled}
          />
        }
      />
      {error && <ErrorAlert description={error} />}

      {isLoading && !profile ? (
        <GlowingCard intensity="subtle">
          <LoadingState label="Загружаем профиль" />
        </GlowingCard>
      ) : profile ? (
        <Stack spacing={6}>
          <QuotaWarningAlert remaining={quotaWarning?.remaining} />
          <ProfileOverviewCard profile={profile} onEdit={openEdit} />

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <QuotaUsageCard
              quota={quota}
              onPurchaseClick={openPlans}
              isPaymentsEnabled={isPaymentsUiEnabled}
            />
            <ProfileSupportCard email={supportEmail} />
          </SimpleGrid>

          <ActivityTimeline items={activity} />
        </Stack>
      ) : (
        <GlowingCard intensity="subtle">
          <EmptyState title="Профиль не найден" description="Обновите страницу или обратитесь в поддержку" />
        </GlowingCard>
      )}

      <ProfileEditDrawer
        isOpen={isEditOpen}
        onClose={closeEdit}
        profile={profile}
        onSubmit={handleEditSubmit}
        isSubmitting={isSaving}
      />

      <PurchaseQuotaModal
        isOpen={isPlansOpen}
        onClose={closePlans}
        plans={plans}
        isLoading={isPlansLoading}
        onReload={loadPlans}
      />
    </Stack>
  );
}

export default ProfilePage;
