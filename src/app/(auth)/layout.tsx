import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold text-primary">
        {SITE_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
