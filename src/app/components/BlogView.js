"use client";

import PostCard from "./PostCard";

export default function BlogView({
  posts,
  selectedTag,
  formatDate,
  onUpdate,
  currentUserId,
  onTagClick,
  scrollToPostId,
  onScrollDone,
  loadingMore,
  hasMore,
  bottomRef,
}) {
  const filtered = posts.filter(
    (post) => !selectedTag || (post.tags && post.tags.includes(selectedTag)),
  );

  if (!posts.length)
    return (
      <p
        style={{
          textAlign: "center",
          padding: "3rem 0",
          color: "var(--text-tertiary)",
          fontSize: "14px",
        }}
      >
        불러오는 중...
      </p>
    );

  return (
    <div>
      {filtered.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          formatDate={formatDate}
          onUpdate={onUpdate}
          currentUserId={currentUserId}
          onTagClick={onTagClick}
          scrollToMe={scrollToPostId === post.id}
          onScrollDone={onScrollDone}
        />
      ))}
      <div ref={bottomRef} style={{ height: "1px" }} />
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
    </div>
  );
}
