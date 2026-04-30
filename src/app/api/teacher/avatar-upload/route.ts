import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function teacherAuthHeader() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  if (tokenFromSession) {
    return { Authorization: `Bearer ${tokenFromSession}` };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  if (tokenFromCookie) {
    return { Authorization: `Bearer ${tokenFromCookie}` };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const authHeader = await teacherAuthHeader();
    if (!authHeader) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "No file provided." }, { status: 400 });
    }

    const safeExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const generatedFileName = `teacher-avatar-${Date.now()}.${safeExt}`;
    const contentType = file.type || "image/jpeg";

    const presignRes = await fetch(`${API_BASE_URL}/teachers/me/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        bucket: "avatars",
        file_name: generatedFileName,
        content_type: contentType,
      }),
    });

    const presignData = await presignRes.json().catch(() => ({}));
    if (!presignRes.ok) {
      return NextResponse.json(
        { detail: (presignData as any)?.detail || "Could not get upload URL." },
        { status: presignRes.status },
      );
    }

    const uploadUrl =
      (presignData as any)?.upload_url ||
      (presignData as any)?.uploadUrl ||
      (presignData as any)?.signed_url ||
      (presignData as any)?.signedUrl ||
      "";
    const publicUrl =
      (presignData as any)?.public_url ||
      (presignData as any)?.publicUrl ||
      (presignData as any)?.file_url ||
      (presignData as any)?.url ||
      "";

    if (!uploadUrl || !publicUrl) {
      return NextResponse.json(
        { detail: "Upload response missing upload/public URL." },
        { status: 502 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const storageErrorText = await uploadRes.text().catch(() => "");
      return NextResponse.json(
        {
          detail: "Could not upload file to storage.",
          storage_status: uploadRes.status,
          storage_error: storageErrorText || null,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ public_url: publicUrl });
  } catch (error: any) {
    return NextResponse.json(
      {
        detail: "Unexpected error while uploading avatar.",
        error: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

