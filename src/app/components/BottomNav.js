"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

const icons = {
  home: (active) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2" : "1.5"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  grid: (active) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        fill={active ? "currentColor" : "none"}
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        fill={active ? "currentColor" : "none"}
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        fill={active ? "currentColor" : "none"}
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  ),
  upload: (active) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12l4-4 4 4" />
    </svg>
  ),
  mypage: (active) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  function isActive(id) {
    if (id === "home") return pathname === "/";
    if (id === "grid") return pathname === "/grid";
    if (id === "upload") return pathname === "/upload";
    if (id === "mypage") return pathname === "/mypage";
    return false;
  }

  const tabs = [
    {
      id: "home",
      action: () => router.push("/"),
    },
    {
      id: "grid",
      action: () => router.push("/grid"),
    },
    {
      id: "upload",
      action: () => {
        if (!user) router.push("/login");
        else router.push("/upload");
      },
    },
    {
      id: "mypage",
      action: () => {
        if (!user) router.push("/login");
        else router.push("/mypage");
      },
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-14 border-t flex items-center justify-around z-50"
      style={{
        background: "var(--background)",
        borderColor: "var(--border-color)",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.id);
        return (
          <button
            key={tab.id}
            onClick={tab.action}
            className="flex-1 h-full flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
            style={{
              color: active ? "var(--foreground)" : "var(--nav-inactive)",
            }}
          >
            {icons[tab.id](active)}
          </button>
        );
      })}
    </div>
  );
}
