"use client";

import { useState } from "react";
import supabase from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage("변경 실패: " + error.message);
    } else {
      setMessage("비밀번호가 변경됐어요! 잠시 후 로그인 페이지로 이동해요.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
  }

  return (
    <div
      style={{ maxWidth: "360px", margin: "5rem auto", padding: "0 1.5rem" }}
    >
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 500,
          letterSpacing: "0.05em",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        새 비밀번호 설정
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      {message && (
        <p
          style={{
            fontSize: "13px",
            color: "#555",
            textAlign: "center",
            marginTop: "12px",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
