"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="text-sm font-semibold text-[var(--ink-soft)] underline underline-offset-2 disabled:opacity-60"
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
