import React from "react";
import { Icon } from "@chakra-ui/react";
import { tokens } from "../theme/tokens";

/**
 * Category configuration with icons and colors
 */
export const CATEGORY_CONFIG = {
  telegram: {
    label: "Telegram",
    color: tokens.colors.brand.primary,
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
        />
      </Icon>
    ),
  },
  ai: {
    label: "AI",
    color: "#8b5cf6",
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12 2C8.13 2 5 5.13 5 9c0 3.03 2.17 5.56 5 6.32V22l3-3h4v-2h-4.7c-.19 0-.36-.11-.45-.28l-.51-1.02 3.51-3.51c.37-.37.59-.88.59-1.41V9c0-3.87-3.13-7-7-7zm0 4c.83 0 1.5.67 1.5 1.5S12.83 9 12 9s-1.5-.67-1.5-1.5S11.17 6 12 6z"
        />
      </Icon>
    ),
  },
  langchain: {
    label: "LangChain",
    color: "#10b981",
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4zm3-12l3 3-3 3V4zm14 16l-3-3 3-3v6z"
        />
      </Icon>
    ),
  },
  control_flow: {
    label: "Control Flow",
    color: tokens.colors.brand.secondary,
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12 2l4 4h-3v4h2l-5 5-5-5h2V6H4l4-4h4zm0 20l-4-4h3v-4H9l5-5 5 5h-2v4h3l-4 4h-4z"
        />
      </Icon>
    ),
  },
  processing: {
    label: "Processing",
    color: tokens.colors.brand.tertiary,
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M9 2v2H7V2h2zm4 0v2h-2V2h2zm4 0v2h-2V2h2zM9 4v2H7V4h2zm8 0v2h-2V4h2zM9 6v2H7V6h2zm8 0v2h-2V6h2zm-4 2v2h-2V8h2zm0 2v2h-2v-2h2zm0 2v2h-2v-2h2zm0 2v2h-2v-2h2zm0 2v2h-2v-2h2zm-4 2v2H7v-2h2zm8 0v2h-2v-2h2zm-4 2v2h-2v-2h2zm0-10v2h-2v-2h2z"
        />
      </Icon>
    ),
  },
  input: {
    label: "Input",
    color: "#10b981", // green
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l6.59-6.59L20 9l-8 8z"
        />
      </Icon>
    ),
  },
  output: {
    label: "Output",
    color: "#f59e0b", // orange
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
      </Icon>
    ),
  },
  data: {
    label: "Data",
    color: "#06b6d4", // cyan
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm6 14c0 .55-2.69 2-6 2s-6-1.45-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4.55c-1.3.95-3.58 1.55-6 1.55s-4.7-.6-6-1.55V9.64c1.47.83 3.61 1.36 6 1.36s4.53-.53 6-1.36v2.81zM12 9C8.69 9 6 7.55 6 7s2.69-2 6-2 6 1.45 6 2-2.69 2-6 2z"
        />
      </Icon>
    ),
  },
  utility: {
    label: "Utility",
    color: "#94a3b8", // slate
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
        />
      </Icon>
    ),
  },
  system: {
    label: "System",
    color: "#0ea5e9",
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.63l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.07 7.07 0 00-1.63-.94l-.36-2.54A.5.5 0 0014.3 2h-3.6a.5.5 0 00-.49.41l-.36 2.54c-.6.23-1.15.54-1.66.91l-2.39-.96a.5.5 0 00-.6.22L3.29 8.44a.5.5 0 00.12.63l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.63l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.37 1.06.68 1.66.91l.36 2.54c.04.24.25.41.49.41h3.6c.24 0 .45-.17.49-.41l.36-2.54c.6-.23 1.15-.54 1.63-.94l2.39.96c.23.09.47 0 .6-.22l1.92-3.32a.5.5 0 00-.12-.63l-2.03-1.58zM12 15a3 3 0 110-6 3 3 0 010 6z"
        />
      </Icon>
    ),
  },
  general: {
    label: "General",
    color: "#14b8a6",
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M3 5h18v2H3zm2 4h14v10H5z" />
      </Icon>
    ),
  },
  default: {
    label: "Other",
    color: tokens.colors.text.tertiary,
    icon: (props) => (
      <Icon viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
        />
      </Icon>
    ),
  },
};

/**
 * Get category configuration by name
 */
export const getCategoryConfig = (category) => {
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, "_") || "default";
  return CATEGORY_CONFIG[normalizedCategory] || CATEGORY_CONFIG.default;
};

/**
 * Extract unique categories from nodes array
 */
export const extractCategories = (nodes) => {
  const categories = new Set();
  nodes.forEach((node) => {
    if (node.meta?.category) {
      categories.add(node.meta.category);
    }
  });
  return Array.from(categories).sort();
};

/**
 * Extract unique tags from nodes array
 */
export const extractTags = (nodes) => {
  const tags = new Set();
  nodes.forEach((node) => {
    if (node.meta?.tags) {
      node.meta.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

/**
 * Count ports for a node
 */
export const countPorts = (node) => {
  const inputs = Object.keys(node.inputs || {}).length;
  const outputs = Object.keys(node.outputs || {}).length;
  return { inputs, outputs };
};
