import { NextResponse } from "next/server";
import { Review } from "@/types";

const KV_KEY = "reviews";

const SAMPLE_REVIEWS: Review[] = [
  {
    id: 1,
    bookTitle: "채식주의자",
    author: "한강",
    student: "서평단 예시",
    penName: "달빛독자",
    content:
      "주인공의 침묵이 세상의 구조적 폭력에 맞서는 더 큰 목소리처럼 느껴졌습니다. 단순한 식습관의 변화가 아닌, 자아와 존재에 대한 근원적인 질문을 담은 작품입니다. 한강 작가의 문장은 마치 시처럼 아름답고 날카롭습니다.",
    rating: 5,
    isPublic: true,
    isAiGenerated: true,
    reactions: { "❤️": 4, "📚": 2, "✨": 3 },
    createdAt: new Date("2026-06-01").toISOString(),
  },
  {
    id: 2,
    bookTitle: "82년생 김지영",
    author: "조남주",
    student: "이수진",
    content:
      "평범한 한 여성의 이야기가 이토록 묵직하게 다가올 줄 몰랐습니다. 김지영의 삶이 곧 우리 주변의 이야기임을 깨달으며 많은 것을 생각하게 만드는 책입니다.",
    rating: 4,
    isPublic: true,
    isAiGenerated: true,
    reactions: { "👍": 3, "❤️": 5 },
    createdAt: new Date("2026-06-10").toISOString(),
  },
];

async function getKV() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

async function getReviews(): Promise<Review[]> {
  const kv = await getKV();
  if (!kv) return SAMPLE_REVIEWS;
  try {
    const reviews = await kv.get<Review[]>(KV_KEY);
    if (!reviews || reviews.length === 0) return SAMPLE_REVIEWS;
    return reviews;
  } catch {
    return SAMPLE_REVIEWS;
  }
}

async function saveReviews(reviews: Review[]) {
  const kv = await getKV();
  if (!kv) return;
  await kv.set(KV_KEY, reviews);
}

export async function GET() {
  const reviews = await getReviews();
  return NextResponse.json(reviews);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookTitle, author, student, penName, content, rating, isPublic, coverImageUrl } = body;

    if (!bookTitle || !author || !student || !content) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const reviews = await getReviews();
    const newReview: Review = {
      id: Date.now(),
      bookTitle,
      author,
      student,
      penName: penName || undefined,
      content,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      isPublic: Boolean(isPublic),
      isAiGenerated: false,
      coverImageUrl: coverImageUrl || undefined,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    const existing = reviews.filter((r) => r.id > 100);
    await saveReviews([newReview, ...existing]);
    return NextResponse.json(newReview, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
