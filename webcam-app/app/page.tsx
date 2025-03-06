'use client';

import { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [rekognitionResult, setRekognitionResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState<string>("STOPPED");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isStreaming) {
      clearImagesFolder();
      enableWebcam();
      startRekognitionModel(); // ✅ Automatically start the model when webcam starts
      interval = setInterval(() => captureImage(), 5000);
    } else {
      stopWebcam();
      stopRekognitionModel(); // ✅ Automatically stop the model when webcam stops
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const clearImagesFolder = async () => {
    try {
      await fetch('/api/clear-images');
      setCapturedImages([]);
    } catch (error) {
      console.error('❌ Error clearing images folder:', error);
    }
  };

  const enableWebcam = async () => {
    if (!videoRef.current) {
        console.error("❌ Video reference not found!");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        console.log("✅ Webcam enabled successfully!");
    } catch (error) {
        console.error("❌ Error accessing webcam:", error);
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

      setCapturedImages((prevImages) => [imageDataUrl, ...prevImages]);

      await saveImageToServer(imageDataUrl);
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

  const sendToRekognition = async (imagePath: string) => {
    if (!imagePath) {
      console.error("❌ No image path set!");
      return;
    }

    console.log("📸 Sending image to API:", imagePath);

    try {
      const response = await fetch("/api/send-to-rekognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath }),
      });

      const data = await response.json();
      console.log("📡 Data from API:", data);
    } catch (error) {
      console.error("❌ Error sending to AWS Rekognition:", error);
    }
  };

  const startRekognitionModel = async () => {
    try {
        const response = await fetch("http://localhost:8000/start-model", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to start Rekognition model");
        }

        const data = await response.json();
        console.log("📡 Rekognition Model Started:", data);
        setModelStatus("RUNNING");
    } catch (error) {
        console.error("❌ Error starting model:", error);
    }
  };

  const stopRekognitionModel = async () => {
    try {
      const response = await fetch("http://localhost:8000/stop-model", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to stop Rekognition model");
      }

      const data = await response.json();
      console.log("🚫 Model Stop Response:", data.message);
      setModelStatus("STOPPED");
    } catch (error) {
      console.error("❌ Error stopping model:", error);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4 text-center">Webcam Capture App</h1>

      <div className="text-center">
        <button className={`btn ${isStreaming ? 'btn-danger' : 'btn-primary'} me-2`} 
          onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Webcam' : 'Start Webcam'}
        </button>

        {!isStreaming && (
          <button className="btn btn-success me-2" onClick={startRekognitionModel}>Start Model</button>
        )}

        {!isStreaming && (
          <button className="btn btn-warning me-2" onClick={stopRekognitionModel}>Stop Model</button>
        )}

        {!isStreaming && capturedImages.length > 0 && (
          <button className="btn btn-info me-2" onClick={() => sendToRekognition(capturedImages[0])}>
            Generate Image
          </button>
        )}
      </div>

      <h3 className="mt-3 text-center">Model Status: <span className={modelStatus === "RUNNING" ? "text-success" : "text-danger"}>{modelStatus}</span></h3>

      <div className="d-flex justify-content-center mt-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded border shadow-lg"
          style={{ width: '480px', height: '360px', display: isStreaming ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
