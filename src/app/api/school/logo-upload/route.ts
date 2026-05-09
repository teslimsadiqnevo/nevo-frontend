import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function schoolAuthContext() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  const sessionUser = (session?.user || {}) as any;
  if (tokenFromSession) {
    return {
      headers: { Authorization: `Bearer ${tokenFromSession}` },
      role: String(sessionUser.role || sessionUser.userRole || "").toLowerCase(),
    };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  const userRaw = cookieStore.get("user")?.value;
  let user: any = null;
  if (userRaw) {
    try {
      user = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      user = null;
    }
  }
  if (tokenFromCookie) {
    return {
      headers: { Authorization: `Bearer ${tokenFromCookie}` },
      role: String(user?.role || user?.user_role || user?.userRole || "").toLowerCase(),
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const authContext = await schoolAuthContext();
    if (!authContext) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    if (authContext.role && !authContext.role.includes("school")) {
      return NextResponse.json({ detail: "Only school admins can upload school logos." }, { status: 403 });
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
      return NextResponse.json({ detail: "Server storage is not configured." }, { status: 500 });
    }

    const safeExt = (file.name.split(".").pop() || "png").toLowerCase();
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const generatedFileName = `${Date.now()}-${safeBaseName || `school-logo.${safeExt}`}`;
    const objectPath = `school-logos/${generatedFileName}`;
    const contentType = file.type || "image/png";
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
        { detail: "Could not upload school logo.", storage_error: error.message },
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
        detail: "Unexpected error while uploading school logo.",
        error: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
