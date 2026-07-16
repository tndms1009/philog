"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import exifr from "exifr";
import getRecipe from "fuji-recipes";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import supabase from "../lib/supabase";

export default function Upload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [memo, setMemo] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  async function compressImage(file) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_SIZE = 1920;
        let { width, height } = img;

        // 비율 유지하며 리사이징
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            URL.revokeObjectURL(url);
            console.log(
              `압축 전: ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          0.85, // 품질 85%
        );
      };
      img.src = url;
    });
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // EXIF 파싱은 원본으로 먼저
    setPreview(URL.createObjectURL(selectedFile));

    // 이미지 압축
    const compressed = await compressImage(selectedFile);
    setFile(compressed);

    try {
      const data = await exifr.parse(selectedFile, {
        makerNote: true,
        pick: [
          "Make",
          "Model",
          "DateTimeOriginal",
          "FNumber",
          "ExposureTime",
          "ISO",
          "FocalLength",
        ],
      });

      let recipe = null;
      if (data?.makerNote) {
        try {
          recipe = getRecipe(data.makerNote);
        } catch (err) {
          console.log("필름 레시피 파싱 실패:", err);
        }
      }

      const finalData = {
        ...data,
        FujiFilmFilmMode: recipe?.FilmMode || null,
        DynamicRange: recipe?.DynamicRange || null,
        WhiteBalance: recipe?.WhiteBalance || null,
        HighlightTone: recipe?.HighlightTone || null,
        ShadowTone: recipe?.ShadowTone || null,
        GrainEffect:
          recipe?.GrainEffectSize && recipe.GrainEffectSize !== "Off"
            ? `${recipe.GrainEffectSize} / ${recipe.GrainEffectRoughness}`
            : recipe?.GrainEffectSize === "Off"
              ? "Off"
              : null,
        NoiseReduction: recipe?.NoiseReduction || null,
        Sharpness: recipe?.Sharpness || null,
        Clarity: recipe?.Clarity || null,
        Saturation: recipe?.Saturation || null,
        ColorChromeEffect: recipe?.ColorChromeEffect || null,
        ColorChromeFxBlue: recipe?.ColorChromeFxBlue || null,
      };

      setExifData(finalData);
    } catch (err) {
      console.log("EXIF 읽기 실패:", err);
      setExifData(null);
    }
  }

  function formatShutterSpeed(exposureTime) {
    if (!exposureTime) return null;
    if (exposureTime >= 1) return `${exposureTime}s`;
    return `1/${Math.round(1 / exposureTime)}s`;
  }

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

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("posts").insert({
        image_url: urlData.publicUrl,
        memo,
        camera: exifData?.Model || null,
        film_simulation: exifData?.FujiFilmFilmMode || null,
        aperture: exifData?.FNumber ? `f/${exifData.FNumber}` : null,
        shutter_speed: formatShutterSpeed(exifData?.ExposureTime),
        iso: exifData?.ISO ? `ISO ${exifData.ISO}` : null,
        taken_at: exifData?.DateTimeOriginal || null,
        user_id: user?.id || null,
        tags: tags.length > 0 ? tags : null,
        is_public: isPublic,
        dynamic_range: exifData?.DynamicRange || null,
        white_balance: exifData?.WhiteBalance || null,
        highlight:
          exifData?.HighlightTone !== null &&
          exifData?.HighlightTone !== undefined
            ? String(exifData.HighlightTone)
            : null,
        shadow:
          exifData?.ShadowTone !== null && exifData?.ShadowTone !== undefined
            ? String(exifData.ShadowTone)
            : null,
        grain: exifData?.GrainEffect || null,
        noise_reduction:
          exifData?.NoiseReduction !== null &&
          exifData?.NoiseReduction !== undefined
            ? String(exifData.NoiseReduction)
            : null,
        sharpness:
          exifData?.Sharpness !== null && exifData?.Sharpness !== undefined
            ? String(exifData.Sharpness)
            : null,
        clarity:
          exifData?.Clarity !== null && exifData?.Clarity !== undefined
            ? String(exifData.Clarity)
            : null,
        saturation: exifData?.Saturation || null,
        color_chrome: exifData?.ColorChromeEffect || null,
        color_chrome_fx_blue: exifData?.ColorChromeFxBlue || null,
      });

      if (insertError) throw insertError;

      router.push("/");
    } catch (err) {
      console.error(err);
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }} className="main-wrap">
      <Header showAbout={false} />

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "1.5rem 1.5rem 5rem",
        }}
      >
        {/* 사진 업로드 영역 */}
        <label
          style={{
            display: "block",
            width: "100%",
            aspectRatio: preview ? "auto" : "4/3",
            borderRadius: "12px",
            border: preview ? "none" : "1.5px dashed var(--border-color)",
            overflow: "hidden",
            cursor: "pointer",
            marginBottom: "1.25rem",
            position: "relative",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", display: "block", borderRadius: "12px" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "10px",
                color: "var(--text-tertiary)",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: "14px" }}>사진을 선택해주세요</span>
              <span style={{ fontSize: "12px" }}>JPG · HEIC · PNG</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {/* 사진 다시 선택 버튼 */}
        {preview && (
          <label
            style={{
              display: "block",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              marginBottom: "1.25rem",
              textDecoration: "underline",
            }}
          >
            사진 다시 선택
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        )}

        {/* EXIF 정보 */}
        {exifData && (
          <div
            style={{
              background: "var(--nav-border)",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1.25rem",
              fontSize: "12px",
              lineHeight: "1.8",
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
              }}
            >
              촬영 정보 · 자동 인식
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2px 12px",
              }}
            >
              {exifData.Model && <div>📷 {exifData.Model}</div>}
              {exifData.FujiFilmFilmMode && (
                <div>🎞️ {exifData.FujiFilmFilmMode}</div>
              )}
              {exifData.FNumber && <div>ƒ/{exifData.FNumber}</div>}
              {exifData.ExposureTime && (
                <div>⏱ {formatShutterSpeed(exifData.ExposureTime)}</div>
              )}
              {exifData.ISO && <div>☀️ ISO {exifData.ISO}</div>}
              {exifData.DateTimeOriginal && (
                <div>
                  📅{" "}
                  {new Date(exifData.DateTimeOriginal).toLocaleDateString(
                    "ko-KR",
                  )}
                </div>
              )}
              {exifData.DynamicRange && <div>🎚️ {exifData.DynamicRange}</div>}
              {exifData.WhiteBalance && <div>⚪ {exifData.WhiteBalance}</div>}
              {exifData.GrainEffect && <div>🌾 {exifData.GrainEffect}</div>}
              {exifData.NoiseReduction != null && (
                <div>🔇 NR {exifData.NoiseReduction}</div>
              )}
              {exifData.Sharpness != null && <div>🔪 {exifData.Sharpness}</div>}
              {exifData.Clarity != null && <div>✨ {exifData.Clarity}</div>}
              {exifData.Saturation && <div>🎨 {exifData.Saturation}</div>}
              {exifData.ColorChromeEffect && (
                <div>🎭 {exifData.ColorChromeEffect}</div>
              )}
            </div>
          </div>
        )}

        {/* 한줄 멘트 */}
        <textarea
          placeholder="오늘의 한 줄..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            marginBottom: "1rem",
            fontSize: "14px",
            fontFamily: "inherit",
            background: "var(--background)",
            color: "var(--foreground)",
            resize: "none",
          }}
        />

        {/* 태그 입력 */}
        <form onSubmit={handleAddTag} style={{ marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="태그 입력 후 Enter (예: 익선동)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              fontSize: "14px",
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
              marginBottom: "1.25rem",
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
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
        {/* 공개/비공개 토글 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
            marginBottom: "1rem",
            borderTop: "1px solid var(--border-color)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--foreground)",
                fontWeight: 500,
              }}
            >
              {isPublic ? "전체 공개" : "나만 보기"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                marginTop: "2px",
              }}
            >
              {isPublic ? "모든 사람이 볼 수 있어요" : "나만 볼 수 있어요"}
            </div>
          </div>
          <div
            onClick={() => setIsPublic(!isPublic)}
            style={{
              width: "48px",
              height: "28px",
              borderRadius: "14px",
              background: isPublic
                ? "var(--foreground)"
                : "var(--border-color)",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "3px",
                left: isPublic ? "23px" : "3px",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>
        {/* 업로드 버튼 */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            width: "100%",
            padding: "13px",
            background: !file ? "var(--border-color)" : "var(--foreground)",
            color: !file ? "var(--text-tertiary)" : "var(--background)",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: file ? "pointer" : "not-allowed",
            letterSpacing: "0.02em",
          }}
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
