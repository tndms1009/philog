"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import GridView from "../components/GridView";
import PostCard from "../components/PostCard";
import supabase from "../lib/supabase";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      fetchProfile(data.user.id);
      fetchMyPosts(data.user.id);
    });
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || "");
      setBio(data.bio || "");
    }
    setLoading(false);
  }

  async function fetchMyPosts(userId) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setPosts(data);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username, bio });

    setSaving(false);
    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      setProfile({ ...profile, username, bio });
      setEditingProfile(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleWithdraw() {
    const confirmed = window.confirm(
      "정말 탈퇴하시겠어요?\n내가 올린 모든 사진이 삭제되고 복구할 수 없어요.",
    );
    if (!confirmed) return;

    setWithdrawing(true);
    try {
      // 1. 내 게시물의 이미지 Storage에서 삭제
      const { data: myPosts } = await supabase
        .from("posts")
        .select("image_url")
        .eq("user_id", user.id);

      if (myPosts && myPosts.length > 0) {
        const fileNames = myPosts
          .map((p) => {
            const url = p.image_url;
            return url.split("/photos/")[1];
          })
          .filter(Boolean);

        if (fileNames.length > 0) {
          await supabase.storage.from("photos").remove(fileNames);
        }
      }

      // 2. DB에서 게시물 삭제
      await supabase.from("posts").delete().eq("user_id", user.id);

      // 3. 프로필 삭제
      await supabase.from("profiles").delete().eq("id", user.id);

      // 4. 계정 삭제
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      alert("탈퇴가 완료됐어요.");
      router.push("/");
    } catch (err) {
      alert("탈퇴 실패: " + err.message);
    } finally {
      setWithdrawing(false);
    }
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
      <div
        className="flex items-center justify-center h-screen"
        style={{ color: "var(--text-tertiary)" }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto">
      {/* 상세보기 */}
      {selectedPost ? (
        <div>
          <PostCard
            post={selectedPost}
            formatDate={formatDate}
            onUpdate={() => fetchMyPosts(user.id)}
            onDeleted={() => {
              setSelectedPost(null);
              setSelectedIndex(null);
            }}
            currentUserId={user?.id}
          />

          <div
            className="fixed z-50 flex flex-col gap-2"
            style={{ bottom: "80px", left: "16px" }}
          >
            {/* 마이페이지로 */}
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

          {/* 이전/다음 */}
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
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
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
        </div>
      ) : (
        <>
          <Header showAbout={false} />
          {/* 프로필 영역 */}
          <div
            className="px-6 py-6"
            style={{ borderBottom: "0.5px solid var(--border-color)" }}
          >
            <div className="flex items-center gap-5 mb-4">
              {/* 프로필 사진 */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: "var(--border-color)" }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                )}
              </div>

              {/* 이름 + 설명 */}
              <div className="flex-1">
                {editingProfile ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="이름"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{
                        border: "1px solid var(--border-color)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="한줄 소개"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{
                        border: "1px solid var(--border-color)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                      }}
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="text-xs px-4 py-2 rounded-lg font-medium"
                        style={{
                          background: "var(--foreground)",
                          color: "var(--background)",
                        }}
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="text-xs px-4 py-2 rounded-lg"
                        style={{
                          border: "1px solid var(--border-color)",
                          background: "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className="text-base font-medium mb-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {profile?.username || user?.email?.split("@")[0]}
                    </div>
                    {profile?.bio && (
                      <div
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {profile.bio}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 설정 버튼 */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 bg-transparent border-none cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
            </div>

            {/* 게시물 수 */}
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              게시물{" "}
              <span
                className="font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {posts.length}
              </span>
              개
            </div>
          </div>

          {/* 내 사진 그리드 */}
          {posts.length > 0 ? (
            <GridView
              posts={posts}
              onPostClick={(post, index) => {
                setSelectedPost(post);
                setSelectedIndex(index);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <p
              className="text-center py-12 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              아직 올린 사진이 없어요
            </p>
          )}
        </>
      )}

      {/* 설정 메뉴 */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
          <div
            className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-[900px] z-50"
            style={{
              background: "var(--background)",
              borderTop: "0.5px solid var(--border-color)",
            }}
          >
            <button
              onClick={() => {
                setEditingProfile(true);
                setShowSettings(false);
              }}
              className="w-full px-6 py-4 text-left text-sm bg-transparent border-none cursor-pointer"
              style={{
                borderBottom: "0.5px solid var(--border-color)",
                color: "var(--foreground)",
              }}
            >
              프로필 수정
            </button>
            <button
              onClick={() => {
                router.push("/reset-password");
                setShowSettings(false);
              }}
              className="w-full px-6 py-4 text-left text-sm bg-transparent border-none cursor-pointer"
              style={{
                borderBottom: "0.5px solid var(--border-color)",
                color: "var(--foreground)",
              }}
            >
              비밀번호 변경
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 text-left text-sm bg-transparent border-none cursor-pointer"
              style={{
                borderBottom: "0.5px solid var(--border-color)",
                color: "#e24b4a",
              }}
            >
              로그아웃
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                handleWithdraw();
              }}
              disabled={withdrawing}
              className="w-full px-6 py-4 text-left text-sm bg-transparent border-none cursor-pointer"
              style={{
                borderBottom: "0.5px solid var(--border-color)",
                color: "#e24b4a",
                opacity: 0.6,
              }}
            >
              {withdrawing ? "탈퇴 중..." : "회원 탈퇴"}
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-6 py-4 text-center text-sm bg-transparent border-none cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              닫기
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
