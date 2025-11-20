import React, { useEffect, useState } from "react";
import {
  Button,
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
  Stack,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { showErrorToast } from "../../utils/errorHandler";

const emptyForm = {
  first_name: "",
  company: "",
  timezone: "",
  phone: "",
  avatar_url: "",
};

function ProfileEditDrawer({ isOpen, onClose, profile, onSubmit, isSubmitting }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (profile && isOpen) {
      setForm({
        first_name: profile.first_name || "",
        company: profile.company || "",
        timezone: profile.timezone || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
    } else if (!isOpen) {
      setForm(emptyForm);
    }
  }, [profile, isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payloadEntries = Object.entries(form)
      .map(([key, value]) => {
        const original = profile?.[key] ?? "";
        if (value === original || (!value && !original)) {
          return null;
        }
        return [key, value || null];
      })
      .filter(Boolean);

    const payload = Object.fromEntries(payloadEntries);

    if (Object.keys(payload).length === 0) {
      toast({
        title: "Изменения не обнаружены",
        description: "Обновите любые поля перед сохранением",
        status: "info",
      });
      return;
    }

    try {
      await onSubmit(payload);
      toast({ title: "Профиль обновлён", status: "success" });
      onClose();
    } catch (error) {
      showErrorToast(toast, error, { title: "Не удалось сохранить профиль" });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">Редактировать профиль</DrawerHeader>
        <DrawerBody>
          <Stack spacing={4} mt={2}>
            <FormControl>
              <FormLabel>Имя</FormLabel>
              <Input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Иван" />
            </FormControl>
            <FormControl>
              <FormLabel>Компания</FormLabel>
              <Input name="company" value={form.company} onChange={handleChange} placeholder="MLservice" />
            </FormControl>
            <FormControl>
              <FormLabel>Часовой пояс</FormLabel>
              <Input name="timezone" value={form.timezone} onChange={handleChange} placeholder="Europe/Moscow" />
            </FormControl>
            <FormControl>
              <FormLabel>Телефон</FormLabel>
              <Input name="phone" value={form.phone} onChange={handleChange} placeholder="71234567890" />
            </FormControl>
            <FormControl>
              <FormLabel>Avatar URL</FormLabel>
              <Textarea
                name="avatar_url"
                value={form.avatar_url}
                onChange={handleChange}
                placeholder="https://cdn..."
                rows={2}
              />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter gap={3} borderTopWidth="1px">
          <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
            Отмена
          </Button>
          <Button colorScheme="brand" type="submit" isLoading={isSubmitting}>
            Сохранить
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ProfileEditDrawer;
