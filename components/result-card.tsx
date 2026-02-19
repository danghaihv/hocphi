"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StudentResult } from "@/components/search-form";
import {
  User,
  BookOpen,
  Phone,
  Calendar,
  Banknote,
  FileText,
  MessageSquare,
  CircleCheckBig,
  Clock,
  QrCode,
} from "lucide-react";

interface ResultCardProps {
  result: StudentResult;
  index: number;
}

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase().trim();
  if (
    normalized.includes("xong") ||
    normalized.includes("hoàn") ||
    normalized.includes("đã") ||
    normalized.includes("done") ||
    normalized.includes("paid")
  ) {
    return "default" as const;
  }
  if (
    normalized.includes("chưa") ||
    normalized.includes("pending") ||
    normalized.includes("chờ")
  ) {
    return "destructive" as const;
  }
  return "secondary" as const;
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase().trim();
  if (
    normalized.includes("xong") ||
    normalized.includes("hoàn") ||
    normalized.includes("đã") ||
    normalized.includes("done") ||
    normalized.includes("paid")
  ) {
    return <CircleCheckBig className="h-3.5 w-3.5" />;
  }
  return <Clock className="h-3.5 w-3.5" />;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground break-words">
          {value}
        </span>
      </div>
    </div>
  );
}

export function ResultCard({ result, index }: ResultCardProps) {
  return (
    <Card className="border-border/60 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-foreground">
              {index > 0 ? `Kết quả ${index + 1}` : "Thông Tin Học Phí"}
            </CardTitle>
          </div>
          {result.trangThai && (
            <Badge
              variant={getStatusVariant(result.trangThai)}
              className="flex items-center gap-1.5 shrink-0"
            >
              {getStatusIcon(result.trangThai)}
              {result.trangThai}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        <InfoRow
          icon={<User className="h-4 w-4" />}
          label="Họ và tên"
          value={result.hoTen}
        />
        <InfoRow
          icon={<BookOpen className="h-4 w-4" />}
          label="Lớp"
          value={result.lop}
        />
        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          label="Số điện thoại PH"
          value={result.soDienThoai}
        />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="Số buổi"
          value={result.soBuoi}
        />

        <Separator className="my-2" />

        <div className="flex items-start gap-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Banknote className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Số tiền</span>
            <span className="text-lg font-bold text-primary">
              {result.soTien || "---"}
            </span>
          </div>
        </div>

        <InfoRow
          icon={<FileText className="h-4 w-4" />}
          label="Nội dung chuyển khoản"
          value={result.ndck}
        />
        <InfoRow
          icon={<MessageSquare className="h-4 w-4" />}
          label="Ghi chú"
          value={result.ghiChu}
        />

        {result.qrCode && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <QrCode className="h-4 w-4" />
                <span className="text-sm font-medium">
                  QR Code Chuyển Khoản
                </span>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.qrCode}
                  alt="QR Code chuyển khoản học phí"
                  className="h-56 w-56 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
