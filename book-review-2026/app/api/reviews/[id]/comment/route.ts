import { NextResponse } from "next/server";
import { Review, Comment } from "@/types";

const KV_KEY = "reviews";

async function getKV() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { author, content } = await req.json();
    if (!author?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "이름과 내용을 입력해 주세요." }, { status: 400 });
    }

    const newComment: Comment = {
      id: Date.now(),
      author: author.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const kv = await getKV();
    if (!kv) {
      return NextResponse.json(newComment, { status: 201 });
    }

    const reviews = (await kv.get<Review[]>(KV_KEY)) ?? [];
    const id = Number(params.id);
    const updated = reviews.map((r) => {
      if (r.id !== id) return r;
      return { ...r, comments: [...(r.comments ?? []), newComment] };
    });

    await kv.set(KV_KEY, updated);
    return NextResponse.json(newComment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
