"use client";

import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import GridView from "../components/GridView";
import PostCard from "../components/PostCard";
import { useRouter } from "next/navigation";
import supabase from "../lib/supabase";

export default function GridPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
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
    if (!bottomRef.current || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, false);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, loading]);

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

  async function fetchMoreAndGo(nextIndex) {
    if (nextIndex < posts.length) {
      setSelectedPost(posts[nextIndex]);
      setSelectedIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!hasMore) return;

    setLoadingMore(true);
    const from = posts.length;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data.length > 0) {
      setPosts((prev) => {
        const newPosts = [...prev, ...data];
        setSelectedPost(newPosts[nextIndex]);
        setSelectedIndex(nextIndex);
        return newPosts;
      });
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (loading) {
    return (
      <div className="main-wrap">
        <Header onLogoClick={() => router.push("/")} showAbout={false} />
        <p
          style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "var(--text-tertiary)",
          }}
        >
          불러오는 중...
        </p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="main-wrap">
      {!selectedPost && <Header onLogoClick={() => router.push("/")} />}

      {!loading && posts.length === 0 && (
        <p
          style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "var(--text-tertiary)",
          }}
        >
          아직 업로드된 사진이 없어요.
        </p>
      )}

      {/* 태그 필터 */}
      {selectedTag && !selectedPost && (
        <div
          style={{
            padding: "0.75rem 1rem",
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
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                opacity: selectedIndex === 0 ? 0.3 : 1,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
              aria-label="이전 사진"
            >
              ←
            </button>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {selectedIndex + 1} / {posts.length}
              {hasMore ? "+" : ""}
            </span>
            <button
              onClick={() => fetchMoreAndGo(selectedIndex + 1)}
              disabled={!hasMore && selectedIndex === posts.length - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                opacity:
                  !hasMore && selectedIndex === posts.length - 1 ? 0.3 : 1,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
              aria-label="이후 사진"
            >
              {loadingMore ? "..." : "→"}
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedPost(null);
              setSelectedIndex(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="fixed w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer z-50"
            style={{
              bottom: "80px",
              left: "16px",
              background: "var(--foreground)",
              color: "var(--background)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
            aria-label="돌아가기"
          >
            ←
          </button>
        </div>
      )}

      {/* 그리드 뷰 */}
      {!selectedPost && (
        <>
          <GridView
            posts={posts}
            selectedTag={selectedTag}
            onPostClick={(post, index) => {
              setSelectedPost(post);
              setSelectedIndex(index);
            }}
          />
          <div ref={bottomRef} style={{ height: "20px" }} />
          {loadingMore && (
            <p
              style={{
                textAlign: "center",
                padding: "1rem 0",
                color: "var(--text-tertiary)",
                fontSize: "13px",
              }}
            >
              불러오는 중...
            </p>
          )}
          {!hasMore && posts.length > 0 && (
            <p
              style={{
                textAlign: "center",
                padding: "1rem 0",
                color: "var(--text-secondary)",
                fontSize: "12px",
              }}
            >
              모든 사진을 불러왔어요
            </p>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
