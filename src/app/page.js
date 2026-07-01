"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      },
    );

    fetchPosts();

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }
  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("불러오기 실패:", error);
    } else {
      setPosts(data);
    }
    setLoading(false);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} — ${time}`;
  }

  return (
    <div
      style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem" }}
      className="main-wrap"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.2rem 1rem",
          borderBottom: "0.5px solid #e5e5e5",
          marginBottom: "0",
        }}
      >
        <span
          style={{ fontSize: "17px", fontWeight: 500, letterSpacing: "0.1em" }}
        >
          PHILOG.
        </span>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {user ? (
            <>
              <a
                href="/upload"
                style={{
                  fontSize: "13px",
                  color: "#555",
                  textDecoration: "none",
                }}
              >
                업로드
              </a>
              <span
                onClick={handleLogout}
                style={{ fontSize: "13px", color: "#888", cursor: "pointer" }}
              >
                로그아웃
              </span>
            </>
          ) : (
            <a
              href="/login"
              style={{
                fontSize: "13px",
                color: "#555",
                textDecoration: "none",
              }}
            >
              로그인
            </a>
          )}
          <div
            style={{
              display: "flex",
              border: "0.5px solid #ccc",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => {
                setView("grid");
                setSelectedPost(null);
              }}
              style={{
                padding: "5px 10px",
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background:
                  view === "grid" && !selectedPost ? "#222" : "transparent",
                color: view === "grid" && !selectedPost ? "#fff" : "#555",
              }}
            >
              ▦ 모아보기
            </button>
            <button
              onClick={() => {
                setView("blog");
                setSelectedPost(null);
              }}
              style={{
                padding: "5px 10px",
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                borderLeft: "0.5px solid #ccc",
                background:
                  view === "blog" && !selectedPost ? "#222" : "transparent",
                color: view === "blog" && !selectedPost ? "#fff" : "#555",
              }}
            >
              ☰ 블로그형
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <p style={{ textAlign: "center", padding: "3rem 0", color: "#999" }}>
          불러오는 중...
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p style={{ textAlign: "center", padding: "3rem 0", color: "#999" }}>
          아직 업로드된 사진이 없어요. <a href="/upload">첫 사진 올리기</a>
        </p>
      )}

      {/* 상세보기 */}
      {selectedPost && (
        <div>
          <PostCard
            post={selectedPost}
            formatDate={formatDate}
            onUpdate={fetchPosts}
            onDeleted={() => setSelectedPost(null)}
            currentUserId={user?.id}
            onTagClick={(tag) => {
              setSelectedTag(tag);
              setSelectedPost(null);
            }}
          />

          <button
            onClick={() => setSelectedPost(null)}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#222",
              color: "#fff",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            ←
          </button>
        </div>
      )}

      {/* 태그 필터 */}
      {selectedTag && (
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#555" }}>
            #{selectedTag} 필터 중
          </span>
          <span
            onClick={() => setSelectedTag(null)}
            style={{
              fontSize: "12px",
              color: "#999",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            전체 보기
          </span>
        </div>
      )}

      {/* 그리드 뷰 */}
      {!selectedPost && view === "grid" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            width: "100%",
          }}
          className="grid-wrap"
        >
          {posts
            .filter(
              (post) =>
                !selectedTag || (post.tags && post.tags.includes(selectedTag)),
            )
            .map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1",
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundImage: `url(${post.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#eee",
                }}
              />
            ))}
        </div>
      )}

      {/* 블로그 뷰 */}
      {!selectedPost && view === "blog" && (
        <div>
          {posts
            .filter(
              (post) =>
                !selectedTag || (post.tags && post.tags.includes(selectedTag)),
            )
            .map((post) => (
              <PostCard
                key={post.id}
                post={post}
                formatDate={formatDate}
                onUpdate={fetchPosts}
                currentUserId={user?.id}
                onTagClick={(tag) => setSelectedTag(tag)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
function PostCard({
  post,
  formatDate,
  onUpdate,
  onDeleted,
  currentUserId,
  onTagClick,
}) {
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState(post.memo || "");
  const [tags, setTags] = useState(post.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

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
      style={{
        marginBottom: "3.5rem",
        paddingBottom: "3.5rem",
        borderBottom: "0.5px solid #e5e5e5",
      }}
    >
      <img
        src={post.image_url}
        alt=""
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
              color: "#999",
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
                  border: "1px solid #ccc",
                  marginBottom: "8px",
                  fontFamily: "inherit",
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
                    border: "1px solid #ccc",
                    fontSize: "13px",
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
                        border: "1px solid #ccc",
                        cursor: "pointer",
                        color: "#555",
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
                    background: "#222",
                    color: "#fff",
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
                    border: "1px solid #ccc",
                    background: "transparent",
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
                    color: "#222",
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
                        border: "1px solid #ddd",
                        color: "#777",
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
                      color: "#333",
                      cursor: "pointer",
                    }}
                  >
                    ✎ 수정
                  </span>
                  <span
                    onClick={handleDelete}
                    style={{
                      fontSize: "12px",
                      color: "#f00",
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
            color: "#555",
          }}
        >
          {post.camera && <div>📷 {post.camera}</div>}
          {post.film_simulation && <div>🎞️ {post.film_simulation}</div>}
          {post.aperture && <div>ƒ {post.aperture}</div>}
          {post.shutter_speed && <div>⏱ {post.shutter_speed}</div>}
          {post.iso && <div>☀️ {post.iso}</div>}
        </div>
      </div>
    </div>
  );
}
