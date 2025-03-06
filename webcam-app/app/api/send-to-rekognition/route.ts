import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imagePath } = await req.json();
    if (!imagePath) return NextResponse.json({ error: 'No image path provided' }, { status: 400 });

    const response = await fetch('http://127.0.0.1:8000/process-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_path: imagePath }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending image to AWS Rekognition:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
