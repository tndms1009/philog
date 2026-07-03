"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import exifr from "exifr";
import getRecipe from "fuji-recipes";
import { createClient } from "@supabase/supabase-js";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Upload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [memo, setMemo] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));

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
      <Header />

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
