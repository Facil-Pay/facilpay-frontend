"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIME_ZONE_COOKIE, detectTimeZone, persistTimeZone, readCookie } from "@/lib/i18n/preferences";

/**
 * On first visit the server cannot know the browser's time zone, so dates
 * render in UTC. Seed the preference cookie from the browser once and
 * re-render; an explicit choice in Preferences is never overwritten.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    if (readCookie(TIME_ZONE_COOKIE)) return;
    const detected = detectTimeZone();
    if (!detected) return;
    persistTimeZone(detected);
    router.refresh();
  }, [router]);

  return null;
}
