import { NextRequest, NextResponse } from "next/server";

const allowedProtocols = new Set(["http:", "https:"]);

function getDirectImageUrl(value: string) {
  const url = new URL(value);

  if (url.hostname === "drive.google.com") {
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileMatch[1])}`;
    }
  }

  return url.toString();
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return NextResponse.json({ error: "Thiếu đường dẫn ảnh QR." }, { status: 400 });
  }

  try {
    const sourceUrl = new URL(source);
    if (!allowedProtocols.has(sourceUrl.protocol)) {
      return NextResponse.json({ error: "Đường dẫn ảnh không hợp lệ." }, { status: 400 });
    }

    const response = await fetch(getDirectImageUrl(source), {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*" },
      redirect: "follow",
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse(null, { status: 415 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải ảnh QR." }, { status: 400 });
  }
}
