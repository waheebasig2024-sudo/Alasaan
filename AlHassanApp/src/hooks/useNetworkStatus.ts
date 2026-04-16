import { useState, useEffect } from "react";
import { isOnline } from "../services/network.service";

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const result = await isOnline();
      if (mounted) setOnline(result);
    }

    check();
    const interval = setInterval(check, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline: online };
}
