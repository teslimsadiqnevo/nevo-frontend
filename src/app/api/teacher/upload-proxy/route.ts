import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const { uploadUrl } = await req.json();

    if (!uploadUrl) {
      return NextResponse.json(
        { detail: "Upload URL is required." },
        { status: 400 },
      );
    }

    const file = await req.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      return NextResponse.json(
        { detail: "Could not upload file to storage." },
        { status: uploadRes.status },
      );
    }

    return NextResponse.json(
      { success: true, message: "File uploaded successfully." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { detail: "Could not upload file. Please try again." },
      { status: 500 },
    );
  }
}
