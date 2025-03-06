import { NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image data provided' }, { status: 400 });

    // Convert base64 to binary
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const imagePath = path.join(process.cwd(), 'public', 'images');

    // Ensure the images folder exists
    await fs.ensureDir(imagePath);

    // Save the image with a timestamped filename
    const filename = `image_${Date.now()}.png`;
    const filePath = path.join(imagePath, filename);

    await fs.writeFile(filePath, base64Data, 'base64');

    return NextResponse.json({ success: true, path: `/images/${filename}` });
  } catch (error) {
    console.error('❌ Error saving image:', error);
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
  }
}
