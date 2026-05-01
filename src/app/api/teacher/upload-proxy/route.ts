import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";

// Note: requires @supabase/supabase-js installed and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set in environment
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
    const bucket = (formData.get("bucket") as string) || "lesson-media";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ detail: "No file provided." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { detail: "Server storage not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: {} },
    });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const path = `uploads/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 502 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return NextResponse.json({ publicUrl, path }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || String(err) }, { status: 500 });
  }
}
