import { useState, useEffect } from "react";

/**
 * Simple localStorage-backed state hook.
 * @param {string} key
 * @param {any} defaultValue
 */
export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // no-op
    }
  }, [key, value]);

  return [value, setValue];
}
