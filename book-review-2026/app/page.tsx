"use client";

import { useState, useEffect } from "react";
import { WriteModal } from "@/components/WriteModal";
import { ReviewCard } from "@/components/ReviewCard";
import { PasswordModal } from "@/components/PasswordModal";
import { Review, FilterType } from "@/types";

export default function App() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [askingPassword, setAskingPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews");
      if (res.ok) {
        setReviews(await res.json());
      } else {
        setError("서평 목록을 불러올 수 없습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleWriteClick() {
    if (authenticated) {
      setWriting(true);
    } else {
      setAskingPassword(true);
    }
  }

  function handlePasswordSuccess() {
    setAuthenticated(true);
    setAskingPassword(false);
    setWriting(true);
  }

  const filtered = reviews.filter((r) => {
    if (filter === "public" && !r.isPublic) return false;
    if (filter === "private" && r.isPublic) return false;
    const q = search.toLowerCase();
    if (
      q &&
      !r.bookTitle.toLowerCase().includes(q) &&
      !r.student.toLowerCase().includes(q) &&
      !r.author.toLowerCase().includes(q) &&
      !(r.penName && r.penName.toLowerCase().includes(q))
    ) {
      return false;
    }
    return true;
  });

  function addReview(r: Review) {
    setReviews((prev) => [r, ...prev]);
  }

  async function handleReact(id: number, emoji: string) {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, reactions: { ...r.reactions, [emoji]: (r.reactions[emoji] || 0) + 1 } };
      })
    );
    try {
      await fetch(`/api/reviews/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // silent
    }
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  const today = new Date()
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--bg)] antialiased text-[var(--ink)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 md:px-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-end border-b-2 border-[var(--ink)] pb-5 mb-8 flex-wrap gap-4">
          <div>
            <h1 className="editorial-title">2026 서평단 북리뷰</h1>
            <div className="editorial-subtitle">
              우리, 함께, 가치 읽기 &nbsp;|&nbsp; COLLECTION 2026
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold tracking-wider text-[var(--ink)] uppercase">{today}</div>
            <div className="text-[10px] text-[#888] tracking-widest font-medium uppercase mt-1">
              MORANGLSAM LITERARY SOCIETY
            </div>
          </div>
        </header>

        {/* Layout */}
        <main className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-10 flex-1">
          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            <button
              onClick={handleWriteClick}
              className="editorial-btn-primary w-full py-4 text-xs font-bold tracking-widest text-center"
            >
              {authenticated ? "✏️ 서평 작성하기" : "🔒 서평 작성하기"}
            </button>

            {/* Filter & Search */}
            <div className="border border-[var(--soft-border)] p-5 bg-white shadow-sm flex flex-col gap-4">
              <span className="search-label-handwriting text-[#888] font-bold">
                Search &amp; Filters
              </span>
              <input
                placeholder="책 제목, 저자, 서평자 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-handwriting w-full border border-[var(--ink)] px-4 py-3 focus:border-[var(--accent)] outline-none bg-white text-[var(--ink)]"
              />
              <div className="grid grid-cols-3 gap-1.5">
                {(["all", "public", "private"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="py-2.5 text-xs font-medium tracking-wider cursor-pointer border transition-all text-center"
                    style={{
                      borderColor: filter === f ? "var(--ink)" : "var(--soft-border)",
                      background: filter === f ? "var(--ink)" : "var(--white)",
                      color: filter === f ? "var(--white)" : "var(--olive)",
                    }}
                  >
                    {f === "all" ? "전체" : f === "public" ? "공개" : "비공개"}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Archives", value: reviews.length },
                { label: "Public", value: reviews.filter((r) => r.isPublic).length },
                { label: "Avg Rating", value: `${averageRating} ★` },
                { label: "Private", value: reviews.filter((r) => !r.isPublic).length },
              ].map((s) => (
                <div key={s.label} className="border border-[var(--soft-border)] p-4 bg-white">
                  <div className="text-[10px] uppercase text-[#888] tracking-widest font-bold mb-1">
                    {s.label}
                  </div>
                  <div className="font-serif text-2xl font-bold text-[var(--ink)]">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Featured Quote */}
            <div className="editorial-quote hidden md:block">
              <p>
                &ldquo;주인공의 침묵이 마치 더 큰 목소리처럼, 세상의 구조적 폭력에 맞서는
                외침처럼 느껴졌다.&rdquo;
              </p>
              <div className="text-right text-xs mt-3 text-[var(--accent)] font-semibold not-italic">
                — 《채식주의자》 한강
              </div>
            </div>
          </aside>

          {/* Reviews Feed */}
          <section className="flex flex-col gap-6">
            {loading ? (
              <div className="text-center py-20 border border-[var(--soft-border)] bg-white text-[var(--olive)]">
                <p className="font-serif italic text-lg mb-2">Loading Archives...</p>
                <p className="text-sm">데이터를 불러오고 있습니다.</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 border border-red-200 bg-red-50 text-red-700">
                <p className="font-semibold mb-1">오류가 발생했습니다</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--soft-border)] bg-white text-[var(--olive)]">
                <p className="font-serif italic text-lg mb-2">No Archives Found</p>
                <p className="text-sm">
                  {search ? "검색 결과가 없습니다." : "아직 서평이 없습니다. 첫 번째 서평을 작성해 보세요!"}
                </p>
              </div>
            ) : (
              filtered.map((r) => (
                <ReviewCard key={r.id} review={r} onReact={handleReact} />
              ))
            )}
          </section>
        </main>

        <footer className="border-t border-[var(--soft-border)] mt-12 pt-6 text-center text-[10px] text-[#aaa] tracking-widest uppercase">
          MORANGLSAM LITERARY SOCIETY &copy; 2026 &nbsp;|&nbsp; 2026 서평단 북리뷰
        </footer>
      </div>

      {askingPassword && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onClose={() => setAskingPassword(false)}
        />
      )}
      {writing && <WriteModal onSubmit={addReview} onClose={() => setWriting(false)} />}
    </div>
  );
}
