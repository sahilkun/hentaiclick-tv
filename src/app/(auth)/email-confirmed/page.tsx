import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function EmailConfirmedPage() {
  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      <h1 className="mb-3 text-2xl font-bold">Email Verified!</h1>
      <p className="mb-8 text-muted-foreground">
        Your email has been verified and your account is now active. You can log
        in and start exploring.
      </p>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Log In
      </Link>
    </div>
  );
}
