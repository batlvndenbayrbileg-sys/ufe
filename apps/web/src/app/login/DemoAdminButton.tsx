"use client";

import { useRouter } from "next/navigation";
import { Button } from "@khiye/ui";
import { setDemoAdmin } from "@/lib/admin";

/**
 * Enables the local demo-admin mode (no database needed) and jumps to the
 * course map, where every lesson is now unlocked. A real deployment logs in as
 * an ADMIN user instead; this is the demo-mode shortcut.
 */
export function DemoAdminButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        setDemoAdmin(true);
        router.push("/app/course/internet-programming");
        router.refresh();
      }}
    >
      🔓 Админаар нэвтрэх (демо)
    </Button>
  );
}
