import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const IMAGE_DIR = path.join(process.cwd(), 'public/images');

    if (fs.existsSync(IMAGE_DIR)) {
      fs.readdirSync(IMAGE_DIR).forEach((file) => {
        fs.unlinkSync(path.join(IMAGE_DIR, file)); // Delete all files
      });
      console.log("✅ Images folder cleared.");
    } else {
      fs.mkdirSync(IMAGE_DIR); // Create folder if it doesn't exist
    }

    return NextResponse.json({ success: true, message: "Images folder cleared." });
  } catch (error) {
    console.error('❌ Error clearing images folder:', error);
    return NextResponse.json({ error: "Failed to clear images folder" }, { status: 500 });
  }
}
