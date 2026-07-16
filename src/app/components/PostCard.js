"use client";

import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import supabase from "../lib/supabase";

export default function PostCard({
  post,
  formatDate,
  onUpdate,
  onDeleted,
  currentUserId,
  onTagClick,
  scrollToMe,
  onScrollDone,
}) {
  const cardRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState(post.memo || "");
  const [tags, setTags] = useState(post.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(post.is_public !== false);
  const [showImageModal, setShowImageModal] = useState(false);
  const polaroidRef = useRef(null);

  useEffect(() => {
    if (scrollToMe && cardRef.current) {
      setTimeout(() => {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        if (onScrollDone) onScrollDone();
      }, 100);
    }
  }, [scrollToMe]);

  function handleAddTag(e) {
    e.preventDefault();
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("posts")
      .update({
        memo,
        tags: tags.length > 0 ? tags : null,
        is_public: isPublic,
      })
      .eq("id", post.id);
    setSaving(false);
    if (error) {
      alert("수정 실패: " + error.message);
    } else {
      setEditing(false);
      if (onUpdate) onUpdate();
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("정말 이 게시물을 삭제할까요?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      if (onUpdate) onUpdate();
      if (onDeleted) onDeleted();
    }
  }

  async function handleSaveImage() {
    if (!polaroidRef.current) return;
    try {
      const canvas = await html2canvas(polaroidRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 모바일 환경 체크
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // 모바일 — 새 탭에서 이미지 열기 (길게 눌러서 저장)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Philog 저장</title>
              <style>
                body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; }
                img { max-width: 100%; }
                p { color: #fff; font-size: 14px; font-family: sans-serif; text-align: center; padding: 0 20px; }
              </style>
            </head>
            <body>
              <p>이미지를 길게 눌러서 저장하세요</p>
              <img src="${dataUrl}" />
            </body>
          </html>
        `);
          newTab.document.close();
        } else {
          alert("팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해주세요.");
        }
      } else {
        // PC — 바로 다운로드
        const link = document.createElement("a");
        link.download = `philog_${post.id}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
      }
    } catch (err) {
      alert("저장 실패: " + err.message + "\n\n스크린샷으로 저장해주세요.");
    }
  }

  return (
    <div
      ref={cardRef}
      style={{
        marginBottom: "3.5rem",
        paddingBottom: "3.5rem",
        borderBottom: "0.5px solid var(--border-color)",
      }}
    >
      {/* 이미지 레이어 팝업 */}
      {showImageModal && (
        <div
          onClick={() => setShowImageModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            gap: "16px",
          }}
        >
          {/* 폴라로이드 프레임 */}
          <div
            ref={polaroidRef}
            onClick={() => setShowImageModal(false)}
            style={{
              backgroundColor: "#fff",
              padding: "8px 8px 0px 8px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              display: "inline-flex",
              flexDirection: "column",
              maxWidth: "90vw",
              maxHeight: "80vh",
            }}
          >
            <img
              src={post.image_url}
              alt=""
              style={{
                display: "block",
                maxHeight: "65vh",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
            <div
              style={{
                backgroundColor: "#fff",
                padding: "8px 6px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                alignItems: "flex-end",
                textAlign: "right",
                fontFamily: "'Special Elite', cursive",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#1a1a1a",
                  letterSpacing: "0.06em",
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                {post.camera ? (
                  post.camera.toUpperCase().includes("FUJI") ||
                  post.camera.toUpperCase().includes("X100") ||
                  post.camera.toUpperCase().includes("X-T") ||
                  post.camera.toUpperCase().includes("X-S") ||
                  post.camera.toUpperCase().includes("X-E") ||
                  post.camera.toUpperCase().includes("GFX") ? (
                    <>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "'Roboto', sans-serif",
                        }}
                      >
                        FUJIFILM{" "}
                      </span>
                      <span
                        style={{
                          fontWeight: 400,
                          fontFamily: "'Roboto', sans-serif",
                        }}
                      >
                        {post.camera}
                      </span>
                    </>
                  ) : (
                    post.camera
                  )
                ) : (
                  "PHILOG."
                )}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: "#555",
                  letterSpacing: "0.04em",
                  fontStyle: "italic",
                  fontFamily: "'Libre Baskerville', serif",
                  fontWeight: 400,
                  letterSpacing: "-0.5px",
                }}
              >
                {[post.iso, post.aperture, post.shutter_speed]
                  .filter(Boolean)
                  .join("  ·  ") || "—"}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: "#555",
                  letterSpacing: "0.04em",
                  fontStyle: "italic",
                  fontFamily: "'Libre Baskerville', serif",
                  fontWeight: 400,
                  letterSpacing: -0.5,
                }}
              >
                {post.taken_at
                  ? new Date(post.taken_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "—"}
              </div>
              <div
                style={{
                  fontSize: "7px",
                  color: "#aaa",
                  letterSpacing: "0.04em",
                  fontStyle: "italic",
                  fontFamily: "'Libre Baskerville', serif",
                  fontWeight: 400,
                  marginTop: "2px",
                }}
              >
                @philog
              </div>
            </div>
          </div>
          {/* 버튼 영역 */}
          <div style={{ display: "flex", gap: "10px" }}>
            {/* 본인 글일 때만 저장 버튼 표시 */}
            {currentUserId === post.user_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveImage();
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: "none",
                  background: "#fff",
                  color: "#1a1a1a",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                💾 저장
              </button>
            )}
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color: "#fff",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 폴라로이드 프레임 */}
      <div
        onClick={() => setShowImageModal(true)}
        style={{
          backgroundColor: "#fff",
          padding: "8px 8px 0px 8px",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          cursor: "pointer",
        }}
      >
        <img
          src={`${post.image_url}?width=900&quality=80`}
          alt=""
          loading="lazy"
          style={{ width: "100%", display: "block" }}
        />
        {/* 하단 정보 */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "8px 6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "0px",
            alignItems: "flex-end",
            textAlign: "right",
            fontFamily: "'Special Elite', cursive",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "#1a1a1a",
              letterSpacing: "0.06em",
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {post.camera ? (
              post.camera.toUpperCase().includes("FUJI") ||
              post.camera.toUpperCase().includes("X100") ||
              post.camera.toUpperCase().includes("X-T") ||
              post.camera.toUpperCase().includes("X-S") ||
              post.camera.toUpperCase().includes("X-E") ||
              post.camera.toUpperCase().includes("GFX") ? (
                <>
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    FUJIFILM{" "}
                  </span>
                  <span
                    style={{
                      fontWeight: 400,
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {post.camera}
                  </span>
                </>
              ) : (
                post.camera
              )
            ) : (
              "PHILOG."
            )}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#555",
              letterSpacing: "0.04em",
              fontStyle: "italic",
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 400,
              letterSpacing: "-0.5px",
            }}
          >
            {[post.iso, post.aperture, post.shutter_speed]
              .filter(Boolean)
              .join("  ·  ") || "—"}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#555",
              letterSpacing: "0.04em",
              fontStyle: "italic",
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 400,
              letterSpacing: -0.5,
            }}
          >
            {post.taken_at
              ? new Date(post.taken_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
              : "—"}
          </div>
          <div
            style={{
              fontSize: "7px",
              color: "#aaa",
              letterSpacing: "0.04em",
              fontStyle: "italic",
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 400,
              marginTop: "2px",
            }}
          >
            @philog
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0",
          flexWrap: "wrap",
          padding: "0 1rem",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "200px",
            paddingRight: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                letterSpacing: "0.05em",
              }}
            >
              {formatDate(post.taken_at)}
            </div>
            {post.is_public === false && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-tertiary)",
                }}
              >
                🔒 비공개
              </span>
            )}
          </div>

          {editing ? (
            <div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "70px",
                  fontSize: "14px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  marginBottom: "8px",
                  fontFamily: "inherit",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
              />
              <form onSubmit={handleAddTag} style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="태그 입력 후 Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    fontSize: "13px",
                    background: "var(--background)",
                    color: "var(--foreground)",
                  }}
                />
              </form>
              {tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        fontSize: "11px",
                        padding: "3px 9px",
                        borderRadius: "20px",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                      }}
                    >
                      #{tag} ✕
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  marginBottom: "10px",
                  borderTop: "0.5px solid var(--border-color)",
                  borderBottom: "0.5px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--foreground)" }}>
                  {isPublic ? "전체 공개" : "나만 보기"}
                </span>
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  style={{
                    width: "44px",
                    height: "26px",
                    borderRadius: "13px",
                    background: isPublic
                      ? "var(--foreground)"
                      : "var(--border-color)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: isPublic ? "21px" : "3px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    fontSize: "12px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--foreground)",
                    color: "var(--background)",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setMemo(post.memo || "");
                    setTags(post.tags || []);
                    setTagInput("");
                    setEditing(false);
                  }}
                  style={{
                    fontSize: "12px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              {post.memo && (
                <div
                  style={{
                    fontSize: "15px",
                    color: "var(--foreground)",
                    lineHeight: "1.65",
                    fontStyle: "italic",
                    marginBottom: "10px",
                  }}
                >
                  "{post.memo}"
                </div>
              )}
              {post.tags && post.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => onTagClick && onTagClick(tag)}
                      style={{
                        fontSize: "11px",
                        padding: "3px 9px",
                        borderRadius: "20px",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        cursor: onTagClick ? "pointer" : "default",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {currentUserId === post.user_id && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <span
                    onClick={() => setEditing(true)}
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    ✎ 수정
                  </span>
                  <span
                    onClick={handleDelete}
                    style={{
                      fontSize: "12px",
                      color: "#e24b4a",
                      cursor: "pointer",
                    }}
                  >
                    🗑 삭제
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="exif-divider"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontFamily: "'Libre Baskerville', serif",
            fontWeight: 400,
            fontStyle: "italic",
            paddingLeft: "1.5rem",
            borderLeft: "0.5px solid var(--border-color)",
            minWidth: "160px",
            flexShrink: 0,
          }}
        >
          {/* 필름 시뮬레이션 — 가장 크게 */}
          {post.film_simulation && (
            <div
              style={{
                fontSize: "14px",
                color: "var(--foreground)",
                letterSpacing: "0.02em",
              }}
            >
              {post.film_simulation}
            </div>
          )}

          {/* DR · WB */}
          {(post.dynamic_range || post.white_balance) && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              {[
                post.dynamic_range && `DR ${post.dynamic_range}`,
                post.white_balance && `${post.white_balance} WB`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          )}

          {/* Grain · NR · Sharpness */}
          {(post.grain || post.noise_reduction || post.sharpness) && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              {[
                post.grain && `Grain ${post.grain}`,
                post.noise_reduction && `NR ${post.noise_reduction}`,
                post.sharpness && `Sharp ${post.sharpness}`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          )}

          {/* Clarity · Saturation · Color Chrome */}
          {(post.clarity ||
            post.saturation ||
            post.color_chrome ||
            post.color_chrome_fx_blue) && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              {[
                post.clarity && `Clarity ${post.clarity}`,
                post.saturation && `Sat ${post.saturation}`,
                post.color_chrome && `CC ${post.color_chrome}`,
                post.color_chrome_fx_blue &&
                  `CCFx ${post.color_chrome_fx_blue}`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          )}

          {/* Highlight · Shadow */}
          {(post.highlight || post.shadow) && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              {[
                post.highlight && `HL ${post.highlight}`,
                post.shadow && `SH ${post.shadow}`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
