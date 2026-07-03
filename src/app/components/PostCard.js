"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

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
      .update({ memo, tags: tags.length > 0 ? tags : null })
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

  return (
    <div
      ref={cardRef}
      style={{
        marginBottom: "3.5rem",
        paddingBottom: "3.5rem",
        borderBottom: "0.5px solid var(--border-color)",
      }}
    >
      <img
        src={post.image_url}
        alt=""
        loading="lazy"
        style={{
          width: "100%",
          borderRadius: "0px",
          marginBottom: "1.25rem",
          display: "block",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "2rem",
          flexWrap: "wrap",
          padding: "0 1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
              letterSpacing: "0.05em",
            }}
          >
            {formatDate(post.taken_at)}
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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          {post.camera && <div>📷 {post.camera}</div>}
          {post.film_simulation && <div>🎞️ {post.film_simulation}</div>}
          {post.aperture && <div>ƒ {post.aperture}</div>}
          {post.shutter_speed && <div>⏱ {post.shutter_speed}</div>}
          {post.iso && <div>☀️ {post.iso}</div>}
          {post.dynamic_range && <div>🎚️ DR {post.dynamic_range}</div>}
          {post.white_balance && <div>⚪ {post.white_balance}</div>}
          {post.highlight && <div>🔆 하이라이트 {post.highlight}</div>}
          {post.shadow && <div>🌑 섀도우 {post.shadow}</div>}
          {post.grain && <div>🌾 그레인 {post.grain}</div>}
          {post.noise_reduction && (
            <div>🔇 노이즈감소 {post.noise_reduction}</div>
          )}
          {post.sharpness && <div>🔪 선명도 {post.sharpness}</div>}
          {post.clarity && <div>✨ 명료도 {post.clarity}</div>}
          {post.saturation && <div>🎨 채도 {post.saturation}</div>}
          {post.color_chrome && <div>🎭 컬러크롬 {post.color_chrome}</div>}
          {post.color_chrome_fx_blue && (
            <div>💙 컬러크롬FX블루 {post.color_chrome_fx_blue}</div>
          )}
        </div>
      </div>
    </div>
  );
}
