"use client";

export default function GridView({ posts, selectedTag, onPostClick }) {
  const filtered = posts.filter(
    (post) => !selectedTag || (post.tags && post.tags.includes(selectedTag)),
  );

  return (
    <div
      className="grid-wrap"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        width: "100%",
      }}
    >
      {filtered.map((post, index) => (
        <div
          key={post.id}
          onClick={() => onPostClick && onPostClick(post, index)}
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
  );
}
