import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { readdir, stat, createReadStream, realpath } from "fs";
import { promisify } from "util";
import path from "path";

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const realpathAsync = promisify(realpath);

const BACKUP_DIR = "/home/backups";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const filename = request.nextUrl.searchParams.get("file");

  // If a specific file is requested, stream it as download
  if (filename) {
    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, sanitized);

    try {
      // Resolve symlinks and verify path stays within BACKUP_DIR
      const resolved = await realpathAsync(filePath);
      if (!resolved.startsWith(BACKUP_DIR + "/")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const fileStat = await statAsync(resolved);
      const stream = createReadStream(resolved);
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
      });

      // RFC 5987 encoded filename to prevent header injection
      const safeFilename = encodeURIComponent(sanitized);
      return new Response(readableStream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
          "Content-Length": fileStat.size.toString(),
        },
      });
    } catch (e) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  // List all backup files
  try {
    const files = await readdirAsync(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter((f) => f.endsWith(".sql.gz") || f.endsWith(".tar.gz") || f.endsWith(".sql.gz.gpg") || f.endsWith(".tar.gz.gpg"))
        .map(async (f) => {
          const fileStat = await statAsync(path.join(BACKUP_DIR, f));
          return {
            name: f,
            size: fileStat.size,
            created: fileStat.mtime.toISOString(),
          };
        })
    );

    // Sort newest first
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({ backups });
  } catch (e) {
    return NextResponse.json({ error: "Failed to read backups" }, { status: 500 });
  }
}
