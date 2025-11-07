import { useEffect, useState } from "react";
import client from "../API/client";

export default function useHealth(pollMs = 10000) {
  const [status, setStatus] = useState({ ok: null, details: null, error: null });

  useEffect(() => {
    let mounted = true;
    let timer;

    const fetchHealth = async () => {
      try {
        const { data } = await client.get("/api/health");
        if (!mounted) return;
        setStatus({ ok: true, details: data, error: null });
      } catch (e) {
        if (!mounted) return;
        setStatus({ ok: false, details: null, error: e });
      } finally {
        if (mounted) timer = setTimeout(fetchHealth, pollMs);
      }
    };

    fetchHealth();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [pollMs]);

  return status;
}
