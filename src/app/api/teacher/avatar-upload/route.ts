import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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

    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json({ detail: "Only image files are supported." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { detail: "Server storage is not configured." },
        { status: 500 },
      );
    }

    const safeExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const generatedFileName = `${Date.now()}-${safeBaseName || `teacher-avatar.${safeExt}`}`;
    const contentType = file.type || "image/jpeg";
    const objectPath = `teacher-avatars/${generatedFileName}`;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: {} },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from("avatars").upload(objectPath, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      return NextResponse.json(
        {
          detail: "Could not upload avatar image.",
          storage_error: error.message,
        },
        { status: 502 },
      );
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    const publicUrl =
      data?.publicUrl || `${supabaseUrl}/storage/v1/object/public/avatars/${objectPath}`;

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

