"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import exifr from "exifr";
import getRecipe from "fuji-recipes";
import { createClient } from "@supabase/supabase-js";

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
        console.log("makerNote 존재:", data.makerNote);
        try {
          recipe = getRecipe(data.makerNote);
          console.log("필름 레시피 전체:", recipe);
        } catch (err) {
          console.log("필름 레시피 파싱 실패:", err);
        }
      } else {
        console.log("makerNote 없음");
      }

      const finalData = {
        ...data,
        FujiFilmFilmMode: recipe?.FilmMode || null,
        DynamicRange: recipe?.DynamicRange || null,
        WhiteBalance: recipe?.WhiteBalance || null,
        HighlightTone: recipe?.ShadowTone || null,
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
      console.log("EXIF 데이터:", finalData);
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
        memo: memo,
        camera: exifData?.Model || null,
        film_simulation: exifData?.FujiFilmFilmMode || null,
        aperture: exifData?.FNumber ? `f/${exifData.FNumber}` : null,
        shutter_speed: formatShutterSpeed(exifData?.ExposureTime),
        iso: exifData?.ISO ? `ISO ${exifData.ISO}` : null,
        focal_length: exifData?.FocalLength
          ? `${exifData.FocalLength}mm`
          : null,
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
      alert("업로드 완료!");
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      <h1 style={{ fontSize: "20px", marginBottom: "1.5rem" }}>사진 업로드</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ marginBottom: "1.5rem", display: "block" }}
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ width: "100%", borderRadius: "8px", marginBottom: "1.5rem" }}
        />
      )}

      {exifData && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <strong>촬영 정보 (자동 인식)</strong>
          {exifData.Model && <div>카메라: {exifData.Model}</div>}
          {exifData.FujiFilmFilmMode && (
            <div>필름 모드: {exifData.FujiFilmFilmMode}</div>
          )}
          {exifData.FNumber && <div>조리개: f/{exifData.FNumber}</div>}
          {exifData.ExposureTime && (
            <div>셔터스피드: {formatShutterSpeed(exifData.ExposureTime)}</div>
          )}
          {exifData.ISO && <div>ISO: {exifData.ISO}</div>}
          {exifData.FocalLength && (
            <div>초점거리: {exifData.FocalLength}mm</div>
          )}
          {exifData.DateTimeOriginal && (
            <div>
              촬영일시: {new Date(exifData.DateTimeOriginal).toLocaleString()}
            </div>
          )}
          {exifData.DynamicRange && (
            <div>다이나믹 레인지: {exifData.DynamicRange}</div>
          )}
          {exifData.WhiteBalance && (
            <div>화이트밸런스: {exifData.WhiteBalance}</div>
          )}
          {exifData.HighlightTone !== null &&
            exifData.HighlightTone !== undefined && (
              <div>하이라이트: {exifData.HighlightTone}</div>
            )}
          {exifData.ShadowTone !== null &&
            exifData.ShadowTone !== undefined && (
              <div>섀도우: {exifData.ShadowTone}</div>
            )}
          {exifData.GrainEffect && <div>그레인: {exifData.GrainEffect}</div>}
          {exifData.NoiseReduction !== null &&
            exifData.NoiseReduction !== undefined && (
              <div>노이즈감소: {exifData.NoiseReduction}</div>
            )}
          {exifData.Sharpness !== null && exifData.Sharpness !== undefined && (
            <div>선명도: {exifData.Sharpness}</div>
          )}
          {exifData.Clarity !== null && exifData.Clarity !== undefined && (
            <div>명료도: {exifData.Clarity}</div>
          )}
          {exifData?.Saturation && <div>채도: {exifData.Saturation}</div>}
          {exifData?.ColorChromeEffect && (
            <div>컬러크롬: {exifData.ColorChromeEffect}</div>
          )}
          {exifData?.ColorChromeFxBlue && (
            <div>컬러크롬 FX 블루: {exifData.ColorChromeFxBlue}</div>
          )}
        </div>
      )}

      <textarea
        placeholder="오늘의 한 줄..."
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "1.5rem",
          fontSize: "14px",
        }}
      />

      <form onSubmit={handleAddTag} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="태그 입력 후 Enter (예: 익선동, 골목)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "14px",
          }}
        />
      </form>

      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "1.5rem",
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

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: "100%",
          padding: "12px",
          background: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
    </div>
  );
}
