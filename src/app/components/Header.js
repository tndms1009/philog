"use client";

import { useRouter } from "next/navigation";

export default function Header({ onLogoClick }) {
  const router = useRouter();

  function handleLogoClick() {
    if (onLogoClick) {
      onLogoClick();
    } else {
      router.push("/");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.2rem 1rem",
        borderBottom: "0.5px solid #e5e5e5",
        background: "var(--background)",
      }}
    >
      <span
        onClick={handleLogoClick}
        style={{
          fontSize: "17px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        PHILOG.
      </span>
    </div>
  );
}
