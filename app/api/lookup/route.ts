import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function sanitize(input: string): string {
  return input
    .replace(/[<>'";&]/g, "")
    .trim()
    .slice(0, 100);
}

function normalizeVietnamese(str: string): string {
  // Convert to lowercase and normalize Unicode
  let normalized = str.toLowerCase().normalize("NFD");
  
  // Remove diacritical marks (accents)
  normalized = normalized.replace(/[\u0300-\u036f]/g, "");
  
  // Map common Vietnamese character issues
  const replacements: { [key: string]: string } = {
    "đ": "d",
    "ð": "d",
  };
  
  for (const [from, to] of Object.entries(replacements)) {
    normalized = normalized.split(from).join(to);
  }
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  return normalized;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-4);
  return "*".repeat(phone.length - 4) + visible;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau 1 phút." },
        { status: 429 }
      );
    }

    // Validate environment variables
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.SHEET_NAME;

    if (!serviceAccountKey || !sheetId || !sheetName) {
      console.error("Missing Google Sheets environment variables");
      return NextResponse.json(
        { error: "Hệ thống chưa được cấu hình. Vui lòng liên hệ quản trị viên." },
        { status: 500 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const hoTen = sanitize(body.hoTen || "");
    const lop = sanitize(body.lop || "");

    if (!hoTen || !lop) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin: Họ tên và Lớp." },
        { status: 400 }
      );
    }

    // Initialize Service Account Authentication
    let serviceAccountJson;
    try {
      serviceAccountJson = JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error("Invalid Service Account JSON:", e);
      return NextResponse.json(
        { error: "Hệ thống chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên." },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountJson,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Fetch data from Google Sheets using Service Account
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
    });

    const rows: string[][] = response.data.values || [];

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Chưa có dữ liệu học phí." },
        { status: 404 }
      );
    }

    // Skip header row, search for matching records
    const normalizedHoTen = normalizeVietnamese(hoTen);
    const normalizedLop = normalizeVietnamese(lop);

    const results = rows.slice(1).filter((row) => {
      const rowHoTen = normalizeVietnamese(row[1] || "");
      const rowLop = normalizeVietnamese(row[2] || "");

      return (
        rowHoTen.includes(normalizedHoTen) &&
        rowLop.includes(normalizedLop)
      );
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy thông tin. Vui lòng kiểm tra lại Họ tên và Lớp.",
        },
        { status: 404 }
      );
    }

    // Map results
    // Columns: ID (0) | Ho ten (1) | Lop (2) | So buoi (3) | So tien (4) | ND CK (5) | Ghi chu (6) | Trang thai (7) | QRcode (8)
    const mappedResults = results.map((row) => ({
      hoTen: row[1] || "",
      lop: row[2] || "",
      soDienThoai: "", // Removed from new schema
      soBuoi: row[3] || "",
      soTien: row[4] || "",
      ndck: row[5] || "",
      ghiChu: row[6] || "",
      trangThai: row[7] || "",
      qrCode: row[8] || "",
    }));

    return NextResponse.json({ results: mappedResults });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
