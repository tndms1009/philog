"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header({
  onLogoClick,
  showAbout: showAboutProp = true,
}) {
  const router = useRouter();
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    if (!showAboutProp) return;
    const hideUntil = localStorage.getItem("philog_about_hide_until");
    if (!hideUntil || new Date() > new Date(hideUntil)) {
      setShowAbout(true);
    }
  }, [showAboutProp]);

  function handleLogoClick() {
    if (onLogoClick) {
      onLogoClick();
    } else {
      router.push("/");
    }
  }

  function handleHideWeek() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    localStorage.setItem("philog_about_hide_until", nextWeek.toISOString());
    setShowAbout(false);
  }

  function handleClose() {
    setShowAbout(false);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.2rem 1rem",
          borderBottom: "0.5px solid var(--border-color)",
          background: "var(--background)",
          position: "relative",
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

        {/* ? 버튼 */}
        {showAboutProp && (
          <button
            onClick={() => setShowAbout(true)}
            style={{
              position: "absolute",
              right: "1rem",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-tertiary)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="서비스 소개"
          >
            ?
          </button>
        )}
      </div>

      {/* 소개 레이어 팝업 */}
      {showAbout && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--background)",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "360px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* 로고 */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  marginBottom: "4px",
                  color: "var(--foreground)",
                }}
              >
                PHILOG.
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.04em",
                }}
              >
                Film + Log
              </div>
            </div>

            {/* 구분선 */}
            <div
              style={{ height: "0.5px", background: "var(--border-color)" }}
            />

            {/* 소개 내용 */}
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.8",
                color: "var(--text-secondary)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              <p>
                후지필름 카메라로 담은 일상을 기록하는 개인 포토 다이어리
                입니다.
              </p>
              <br />
              <p>
                사진을 올리면 촬영 정보(EXIF)와 필름 레시피가 자동으로 기록되고,
                나만의 필름 감성 아카이브를 만들 수 있어요.
              </p>
              <br />
              <p style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                Claude AI와 함께 기획·개발·배포한 1인 풀스택 프로젝트입니다.
              </p>
            </div>

            {/* 버튼 영역 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--foreground)",
                  color: "var(--background)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                둘러보기
              </button>
              <button
                onClick={handleHideWeek}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-tertiary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                일주일간 보지 않기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
