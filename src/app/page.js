"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import GridView from "./components/GridView";
import BlogView from "./components/BlogView";
import PostCard from "./components/PostCard";

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
  const [scrollToPostId, setScrollToPostId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
  const touchStartX = useRef(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null),
    );
    fetchPosts();
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!bottomRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, false);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page]);

  async function fetchPosts(pageNum = 0, replace = true) {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("불러오기 실패:", error);
    } else {
      if (replace) setPosts(data);
      else setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }

    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
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

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 80 && selectedPost) {
      setSelectedPost(null);
      setView("grid");
    }
    touchStartX.current = null;
  }

  return (
    <div
      className="main-wrap"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!selectedPost && (
        <Header
          onLogoClick={() => {
            setSelectedPost(null);
            setSelectedTag(null);
            setView("grid");
          }}
        />
      )}

      {loading && (
        <p
          style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "var(--text-tertiary)",
          }}
        >
          불러오는 중...
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p
          style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "var(--text-tertiary)",
          }}
        >
          아직 업로드된 사진이 없어요. <a href="/upload">첫 사진 올리기</a>
        </p>
      )}

      {/* 태그 필터 */}
      {selectedTag && (
        <div
          style={{
            padding: "0.75rem 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            #{selectedTag} 필터 중
          </span>
          <span
            onClick={() => setSelectedTag(null)}
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            전체 보기
          </span>
        </div>
      )}

      {/* 상세보기 */}
      {selectedPost && (
        <div>
          <PostCard
            post={selectedPost}
            formatDate={formatDate}
            onUpdate={fetchPosts}
            onDeleted={() => {
              setSelectedPost(null);
              setSelectedIndex(null);
            }}
            currentUserId={user?.id}
            onTagClick={(tag) => {
              setSelectedTag(tag);
              setSelectedPost(null);
              setSelectedIndex(null);
            }}
          />

          {/* 이전/다음 네비게이션 */}
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
            <button
              onClick={() => {
                const prev = selectedIndex - 1;
                if (prev >= 0) {
                  setSelectedPost(posts[prev]);
                  setSelectedIndex(prev);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={selectedIndex === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-opacity"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                opacity: selectedIndex === 0 ? 0.3 : 1,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              ←
            </button>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {selectedIndex + 1} / {posts.length}
            </span>
            <button
              onClick={() => {
                const next = selectedIndex + 1;
                if (next < posts.length) {
                  setSelectedPost(posts[next]);
                  setSelectedIndex(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={selectedIndex === posts.length - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-opacity"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                opacity: selectedIndex === posts.length - 1 ? 0.3 : 1,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              →
            </button>
          </div>

          {/* 뒤로가기 버튼 */}
          <div
            className="fixed z-50 flex flex-col gap-2"
            style={{ bottom: "80px", left: "16px" }}
          >
            {/* 홈으로 */}
            <button
              onClick={() => {
                setSelectedPost(null);
                setSelectedIndex(null);
                setView("grid");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                <rect
                  x="9"
                  y="12"
                  width="6"
                  height="9"
                  fill="var(--background)"
                />
              </svg>
            </button>

            {/* 뒤로가기 */}
            <button
              onClick={() => {
                setSelectedPost(null);
                setSelectedIndex(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              ←
            </button>
          </div>
        </div>
      )}

      {/* 그리드 뷰 */}
      {!selectedPost && view === "grid" && (
        <GridView
          posts={posts}
          selectedTag={selectedTag}
          onPostClick={(post, index) => {
            setSelectedPost(post);
            setSelectedIndex(index);
          }}
        />
      )}

      {/* 블로그 뷰 */}
      {!selectedPost && view === "blog" && (
        <BlogView
          posts={posts}
          selectedTag={selectedTag}
          formatDate={formatDate}
          onUpdate={fetchPosts}
          currentUserId={user?.id}
          onTagClick={(tag) => setSelectedTag(tag)}
          scrollToPostId={scrollToPostId}
          onScrollDone={() => setScrollToPostId(null)}
          loadingMore={loadingMore}
          hasMore={hasMore}
          bottomRef={bottomRef}
        />
      )}

      <BottomNav
        view={view}
        onViewChange={(v) => {
          setView(v);
          setSelectedPost(null);
        }}
      />
    </div>
  );
}
