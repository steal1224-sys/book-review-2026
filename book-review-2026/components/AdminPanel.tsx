"use client";
import { useState, useRef, useEffect } from "react";
import { BookSeed } from "@/types";

interface Props {
  onClose: () => void;
}

export function AdminPanel({ onClose }: Props) {
  const [books, setBooks] = useState<BookSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [form, setForm] = useState({
    bookTitle: "",
    author: "",
    publishYear: "",
    keyword: "",
    relatedSentence: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/books");
      if (res.ok) {
        setBooks(await res.json());
      } else {
        setListError("목록을 불러올 수 없습니다.");
      }
    } catch {
      setListError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.bookTitle.trim() || !form.author.trim()) {
      setFormError("책 제목과 저자는 필수 항목입니다.");
      return;
    }
    setSubmitting(true);
    setFormError("");

    try {
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

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coverImageUrl }),
      });

      if (res.ok) {
        const newBook: BookSeed = await res.json();
        setBooks((prev) => [newBook, ...prev]);
        setForm({ bookTitle: "", author: "", publishYear: "", keyword: "", relatedSentence: "" });
        setCoverFile(null);
        setCoverPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setFormError("등록에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 책 데이터를 삭제할까요?")) return;
    const prev = books;
    setBooks((cur) => cur.filter((b) => b.id !== id));
    try {
      const res = await fetch("/api/admin/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBooks(prev);
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[var(--ink)]">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[var(--ink)] p-6 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--ink)]">서평 10분 글샘 · 책 데이터 관리</h2>
            <p className="text-[10px] text-[var(--olive)] tracking-widest uppercase mt-0.5">Librarian Panel</p>
          </div>
          <button onClick={onClose} className="text-[var(--olive)] hover:text-[var(--ink)] text-3xl leading-none transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 border-b border-[var(--soft-border)]">
          {/* 책표지 업로드 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">
              책 표지 <span className="normal-case text-[#aaa]">(선택)</span>
            </span>
            <div className="flex items-start gap-4">
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

          {/* 책 제목 / 저자 / 출판년도 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">출판년도</span>
              <input value={form.publishYear} onChange={(e) => set("publishYear", e.target.value)} placeholder="예: 2007"
                className="border border-[var(--soft-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
            </label>
          </div>

          {/* 키워드 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">키워드</span>
            <input value={form.keyword} onChange={(e) => set("keyword", e.target.value)} placeholder="예: 채식, 자아, 폭력, 존재"
              className="border border-[var(--soft-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] bg-white" />
          </label>

          {/* 관련 문장 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">관련 문장</span>
            <textarea value={form.relatedSentence} onChange={(e) => set("relatedSentence", e.target.value)} rows={3}
              placeholder="학생이 서평 작성 시 참고할 인상적인 문장이나 힌트 문장을 입력하세요."
              className="border border-[var(--soft-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] resize-none bg-white leading-relaxed" />
          </label>

          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3 editorial-btn-primary text-xs font-bold tracking-widest uppercase">
            {submitting ? "등록 중..." : "책 데이터 등록"}
          </button>
        </form>

        {/* 등록된 목록 */}
        <div className="p-6 flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">등록된 책 데이터</span>
          {loading ? (
            <p className="text-sm text-[var(--olive)] py-6 text-center">불러오는 중...</p>
          ) : listError ? (
            <p className="text-sm text-red-600 py-6 text-center">{listError}</p>
          ) : books.length === 0 ? (
            <p className="text-sm text-[#aaa] py-6 text-center">아직 등록된 책 데이터가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {books.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border border-[var(--soft-border)] p-3">
                  <div className="w-10 h-14 flex-shrink-0 bg-[var(--bg)] overflow-hidden border border-[var(--soft-border)]">
                    {b.coverImageUrl && (
                      <img src={b.coverImageUrl} alt={b.bookTitle} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--ink)] truncate">
                      {b.bookTitle} <span className="font-normal text-[var(--olive)]">· {b.author}{b.publishYear ? ` (${b.publishYear})` : ""}</span>
                    </div>
                    {b.keyword && <div className="text-xs text-[var(--olive)] mt-0.5 truncate">키워드: {b.keyword}</div>}
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-[10px] uppercase tracking-widest font-bold text-[#aaa] hover:text-red-500 flex-shrink-0 px-2 py-1"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
