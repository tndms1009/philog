"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // 'login' or 'signup' or 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setMessage("회원가입 실패: " + error.message);
      } else {
        setMessage("가입 완료! 이메일을 확인해서 인증해주세요.");
      }
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setMessage("요청 실패: " + error.message);
      } else {
        setMessage("비밀번호 재설정 메일을 보냈어요! 메일함을 확인해주세요.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setMessage("로그인 실패: " + error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }
  }

  return (
    <div
      style={{
        maxWidth: "360px",
        margin: "5rem auto",
        padding: "0 1.5rem",
      }}
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
        PHILOG.
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "10px",
            fontSize: "14px",
          }}
        />

        {mode !== "forgot" && (
          <input
            type="password"
            placeholder="비밀번호"
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
        )}

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
            marginBottom: "12px",
          }}
        >
          {loading
            ? "처리 중..."
            : mode === "login"
              ? "로그인"
              : mode === "signup"
                ? "회원가입"
                : "재설정 메일 보내기"}
        </button>
      </form>

      {message && (
        <p
          style={{
            fontSize: "13px",
            color: "#c33",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {message}
        </p>
      )}

      <p style={{ fontSize: "13px", color: "#888", textAlign: "center" }}>
        {mode === "login" && (
          <>
            계정이 없으신가요?{" "}
            <span
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              style={{
                color: "#222",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              회원가입
            </span>
            <br />
            <span
              onClick={() => {
                setMode("forgot");
                setMessage("");
              }}
              style={{
                color: "#222",
                cursor: "pointer",
                textDecoration: "underline",
                display: "inline-block",
                marginTop: "8px",
              }}
            >
              비밀번호를 잊으셨나요?
            </span>
          </>
        )}
        {mode === "signup" && (
          <>
            이미 계정이 있으신가요?{" "}
            <span
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              style={{
                color: "#222",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              로그인
            </span>
          </>
        )}
        {mode === "forgot" && (
          <span
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            style={{
              color: "#222",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            로그인으로 돌아가기
          </span>
        )}
      </p>
    </div>
  );
}
