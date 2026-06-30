"use client";
import { useState } from "react";
import { Review, Comment } from "@/types";

const EMOJI_OPTIONS = ["👍", "❤️", "📚", "✨", "🎯", "💭"];

interface Props {
  review: Review;
  onReact: (id: number, emoji: string) => void;
}

export function ReviewCard({ review, onReact }: Props) {
  const displayName = review.penName || review.student;
  const stars = Array.from({ length: 5 }, (_, i) => (i < review.rating ? "★" : "☆")).join("");
  const date = new Date(review.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comments, setComments] = useState<Comment[]>(review.comments ?? []);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !content.trim()) {
      setError("이름과 내용을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setAuthor("");
        setContent("");
        setShowCommentForm(false);
      } else {
        setError("의견 등록에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="bg-white border border-[var(--soft-border)] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* 책 표지 */}
        {review.coverImageUrl && (
          <div className="flex-shrink-0 w-16 h-24 overflow-hidden border border-[var(--soft-border)] shadow-sm">
            <img src={review.coverImageUrl} alt={`${review.bookTitle} 표지`} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 ${
              review.isPublic ? "bg-[var(--ink)] text-white" : "border border-[var(--soft-border)] text-[var(--olive)]"
            }`}>
              {review.isPublic ? "PUBLIC" : "PRIVATE"}
            </span>
            {review.isAiGenerated && (
              <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 border border-[var(--accent)] text-[var(--accent)]">
                AI 예시
              </span>
            )}
            <span className="text-[9px] text-[#aaa] tracking-widest">{date}</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-[var(--ink)] leading-tight">
            《{review.bookTitle}》
          </h2>
          <p className="text-xs text-[var(--olive)] tracking-wide mt-1">
            저자: {review.author}&nbsp;&nbsp;|&nbsp;&nbsp;서평:{" "}
            <span className="font-semibold">{displayName}</span>
            {review.penName && review.penName !== review.student && (
              <span className="text-[var(--soft-border)] ml-1">({review.student})</span>
            )}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[var(--accent)] tracking-widest text-base">{stars}</div>
          <div className="text-[10px] text-[#aaa] mt-0.5">{review.rating} / 5</div>
        </div>
      </div>

      <div className="border-t border-[var(--soft-border)] mb-4" />

      {/* Content */}
      <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap line-clamp-5">
        {review.content}
      </p>

      {/* Reactions */}
      <div className="flex gap-1.5 mt-5 flex-wrap">
        {EMOJI_OPTIONS.map((emoji) => {
          const count = review.reactions[emoji] || 0;
          return (
            <button key={emoji} onClick={() => onReact(review.id, emoji)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 border transition-all cursor-pointer ${
                count > 0 ? "border-[var(--ink)] bg-[var(--bg)]" : "border-[var(--soft-border)] hover:border-[var(--olive)] hover:bg-[var(--bg)]"
              }`}>
              <span>{emoji}</span>
              {count > 0 && <span className="text-[10px] font-bold text-[var(--olive)]">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Comments — 공개 서평에만 표시 */}
      {review.isPublic && (
        <div className="mt-5 border-t border-[var(--soft-border)] pt-4">
          {/* 기존 댓글 목록 */}
          {comments.length > 0 && (
            <div className="flex flex-col gap-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="bg-[var(--bg)] border border-[var(--soft-border)] px-4 py-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--ink)]">{c.author}</span>
                    <span className="text-[9px] text-[#aaa]">
                      {new Date(c.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink)] leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 토글 버튼 */}
          <button
            onClick={() => setShowCommentForm((v) => !v)}
            className="text-[10px] font-bold tracking-widest uppercase text-[var(--olive)] border border-[var(--soft-border)] px-3 py-2 hover:border-[var(--ink)] transition-colors"
          >
            {showCommentForm ? "✕ 닫기" : `💬 의견 남기기${comments.length > 0 ? ` (${comments.length})` : ""}`}
          </button>

          {/* 댓글 작성 폼 */}
          {showCommentForm && (
            <form onSubmit={handleCommentSubmit} className="mt-3 flex flex-col gap-3">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="이름"
                className="border border-[var(--soft-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)] bg-white w-full sm:w-48"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이 서평에 대한 의견을 자유롭게 남겨주세요."
                rows={3}
                className="border border-[var(--soft-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)] resize-none bg-white w-full leading-relaxed"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="self-start editorial-btn-primary px-5 py-2 text-[10px] font-bold tracking-widest uppercase disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "의견 등록"}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
