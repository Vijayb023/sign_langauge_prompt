'use client';

import { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [latestImagePath, setLatestImagePath] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isStreaming) {
      enableWebcam();
      interval = setInterval(() => captureImage(), 5000); // Auto capture every 5 seconds
    } else {
      stopWebcam();
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/png');

      // Save to state
      setImages((prevImages) => [imageDataUrl, ...prevImages]);

      // Save to server and get image path
      const imagePath = await saveImageToServer(imageDataUrl);
      if (imagePath) setLatestImagePath(imagePath);
    }
  };

  const saveImageToServer = async (imageDataUrl: string) => {
    try {
      const response = await fetch('/api/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const result = await response.json();
      return result.path || null;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  };

  const sendToRekognition = async () => {
    if (!latestImagePath) return;

    try {
      const response = await fetch('/api/send-to-rekognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: latestImagePath }),
      });

      const result = await response.json();
      console.log('AWS Rekognition Result:', result);
      alert(`Rekognition Response: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Error sending to AWS Rekognition:', error);
    }
  };

  return (
    <div className="container text-center py-5">
      <h1 className="mb-4">Webcam Capture App</h1>

      <div className="mb-3">
        <button className={`btn ${isStreaming ? 'btn-danger' : 'btn-primary'}`} onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Webcam' : 'Start Webcam'}
        </button>
      </div>

      <div className="d-flex justify-content-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded border shadow-lg"
          style={{ width: '480px', height: '360px', display: isStreaming ? 'block' : 'none' }}
        />
      </div>

      {!isStreaming && latestImagePath && (
        <div className="mt-3">
          <button className="btn btn-success" onClick={sendToRekognition}>
            Generate Image
          </button>
        </div>
      )}

      <div className="mt-4">
        <h2>Captured Images</h2>
        <div className="row g-3">
          {images.map((imgSrc, index) => (
            <div key={index} className="col-md-3">
              <img src={imgSrc} alt={`Captured ${index}`} className="img-fluid rounded shadow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
