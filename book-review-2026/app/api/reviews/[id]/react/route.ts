import { NextResponse } from "next/server";
import { Review } from "@/types";

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
  const kv = await getKV();
  if (!kv) {
    return NextResponse.json({ ok: true }); // no-op without KV
  }

  try {
    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ error: "이모지가 없습니다." }, { status: 400 });
    }

    const reviews = (await kv.get<Review[]>(KV_KEY)) ?? [];
    const id = Number(params.id);
    const updated = reviews.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        reactions: {
          ...r.reactions,
          [emoji]: (r.reactions[emoji] || 0) + 1,
        },
      };
    });

    await kv.set(KV_KEY, updated);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
