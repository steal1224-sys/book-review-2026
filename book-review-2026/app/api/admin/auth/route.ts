import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "1224";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "비밀번호가 틀렸습니다." }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "오류가 발생했습니다." }, { status: 500 });
  }
}
