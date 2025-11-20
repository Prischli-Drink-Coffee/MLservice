export const STATUS_COLORS = {
  NEW: "purple",
  PROCESSING: "yellow",
  SUCCESS: "green",
  FAILURE: "red",
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};
