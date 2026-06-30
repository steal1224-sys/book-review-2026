"use client";
import { useState, useRef } from "react";
import { Review } from "@/types";

interface Props {
  onSubmit: (r: Review) => void;
  onClose: () => void;
}

export function WriteModal({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    bookTitle: "",
    author: "",
    student: "",
    penName: "",
    content: "",
    rating: 5,
    isPublic: true,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bookTitle.trim() || !form.author.trim() || !form.student.trim() || !form.content.trim()) {
      setError("필수 항목(*)을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // 표지 이미지 업로드
      let coverImageUrl: string | undefined;
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          coverImageUrl = url;
        }
      }

      // 서평 등록
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coverImageUrl }),
      });
      if (res.ok) {
        const data: Review = await res.json();
        onSubmit(data);
        onClose();
      } else {
        setError("서평 등록에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[var(--ink)]">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[var(--ink)] p-6 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--ink)]">서평 작성</h2>
            <p className="text-[10px] text-[var(--olive)] tracking-widest uppercase mt-0.5">Write a Review</p>
          </div>
          <button onClick={onClose} className="text-[var(--olive)] hover:text-[var(--ink)] text-3xl leading-none transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* 책표지 업로드 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">
              책 표지 <span className="normal-case text-[#aaa]">(선택)</span>
            </span>
            <div className="flex items-start gap-4">
              {/* 미리보기 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-28 border-2 border-dashed border-[var(--soft-border)] flex items-center justify-center cursor-pointer hover:border-[var(--ink)] transition-colors flex-shrink-0 overflow-hidden bg-[var(--bg)]"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="표지 미리보기" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-[#aaa] text-center leading-tight px-1">클릭하여<br/>업로드</span>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs border border-[var(--soft-border)] px-3 py-2 hover:border-[var(--ink)] transition-colors text-[var(--olive)] text-left"
                >
                  {coverFile ? `✓ ${coverFile.name}` : "이미지 파일 선택 (JPG, PNG, 5MB 이하)"}
                </button>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-[10px] text-[#aaa] hover:text-red-500 text-left"
                  >
                    ✕ 제거
                  </button>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* 책 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">책 제목 *</span>
              <input value={form.bookTitle} onChange={(e) => set("bookTitle", e.target.value)} placeholder="예: 채식주의자"
                className="border border-[var(--ink)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">저자 *</span>
              <input value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="예: 한강"
                className="border border-[var(--ink)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">학생 이름 *</span>
              <input value={form.student} onChange={(e) => set("student", e.target.value)} placeholder="예: 김민지"
                className="border border-[var(--ink)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">필명 <span className="normal-case text-[#aaa]">(선택)</span></span>
              <input value={form.penName} onChange={(e) => set("penName", e.target.value)} placeholder="예: 달빛서평가"
                className="border border-[var(--soft-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
            </label>
          </div>

          {/* 평점 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">평점 *</span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => set("rating", n)}
                  className={`text-3xl transition-colors leading-none ${n <= form.rating ? "text-[var(--accent)]" : "text-[var(--soft-border)]"} hover:text-[var(--accent)]`}>★</button>
              ))}
              <span className="ml-3 text-sm text-[var(--olive)] font-medium">{form.rating}점</span>
            </div>
          </div>

          {/* 서평 내용 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">서평 내용 *</span>
            <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={7}
              placeholder="책을 읽고 느낀 점, 인상적인 구절, 추천 이유 등을 자유롭게 작성해 주세요."
              className="border border-[var(--ink)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] resize-none bg-white leading-relaxed" />
          </label>

          {/* 공개 여부 */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("isPublic", !form.isPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.isPublic ? "bg-[var(--ink)]" : "bg-[var(--soft-border)]"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${form.isPublic ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <span className="text-sm font-semibold text-[var(--ink)]">{form.isPublic ? "공개 서평" : "비공개 서평"}</span>
              <p className="text-[10px] text-[var(--olive)] mt-0.5">{form.isPublic ? "모든 서평단 멤버가 볼 수 있습니다." : "나만 볼 수 있습니다."}</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-[var(--soft-border)]">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-[var(--soft-border)] text-xs font-bold tracking-widest uppercase text-[var(--olive)] hover:border-[var(--ink)] transition-colors">
              취소
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 editorial-btn-primary text-xs font-bold tracking-widest uppercase">
              {submitting ? "등록 중..." : "서평 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
