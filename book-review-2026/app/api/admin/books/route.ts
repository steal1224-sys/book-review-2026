import { NextResponse } from "next/server";
import { BookSeed } from "@/types";

const KV_KEY = "book_seeds";

async function getKV() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

async function getBooks(): Promise<BookSeed[]> {
  const kv = await getKV();
  if (!kv) return [];
  try {
    const books = await kv.get<BookSeed[]>(KV_KEY);
    return books || [];
  } catch {
    return [];
  }
}

async function saveBooks(books: BookSeed[]) {
  const kv = await getKV();
  if (!kv) return;
  await kv.set(KV_KEY, books);
}

export async function GET() {
  const books = await getBooks();
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookTitle, author, publishYear, coverImageUrl, keyword, relatedSentence } = body;

    if (!bookTitle || !author) {
      return NextResponse.json({ error: "책 제목과 저자는 필수입니다." }, { status: 400 });
    }

    const books = await getBooks();
    const newBook: BookSeed = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      bookTitle,
      author,
      publishYear: publishYear || "",
      coverImageUrl: coverImageUrl || undefined,
      keyword: keyword || "",
      relatedSentence: relatedSentence || "",
      createdAt: new Date().toISOString(),
    };

    await saveBooks([newBook, ...books]);
    return NextResponse.json(newBook, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const books = await getBooks();
    const filtered = books.filter((b) => b.id !== id);
    await saveBooks(filtered);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
