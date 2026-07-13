"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export function AdminLoginModal({ onSuccess, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.error ?? "비밀번호가 틀렸습니다.");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm shadow-2xl border-2 border-[var(--ink)]">
        <div className="flex justify-between items-center border-b-2 border-[var(--ink)] px-6 py-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-[var(--ink)]">사서교사 관리</h2>
            <p className="text-[10px] text-[var(--olive)] tracking-widest uppercase mt-0.5">
              Librarian Only
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--olive)] hover:text-[var(--ink)] text-3xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--olive)]">
              관리자 비밀번호
            </label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="border border-[var(--ink)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] bg-white tracking-widest text-center text-lg"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 editorial-btn-primary text-xs font-bold tracking-widest uppercase"
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
