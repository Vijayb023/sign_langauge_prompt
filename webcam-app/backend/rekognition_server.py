from fastapi import FastAPI, HTTPException, Body
from typing import List, Dict
import boto3
import os
import json

app = FastAPI()

MODEL_ARN = "arn:aws:rekognition:us-east-1:139008108936:project/demo/version/demo.2025-02-25T00.12.52/1740460372695"
MIN_CONFIDENCE = 95
IMAGE_DIR = "../public/images/"

client = boto3.client("rekognition")

@app.post("/api/send-to-rekognition")
async def send_to_rekognition(data: Dict[str, List[str]] = Body(...)):
    """Processes provided images using AWS Rekognition."""
    print("🟢 Received request data:", json.dumps(data, indent=2))  # Log request

    if "images" not in data or not data["images"]:
        raise HTTPException(status_code=400, detail="No image path provided")

    results = []
    for image_data_url in data["images"]:
        image_filename = image_data_url.split("/")[-1]  # Extract filename
        image_path = os.path.join(IMAGE_DIR, image_filename)

        if not os.path.exists(image_path):
            print(f"⚠️ Skipping {image_filename}, file not found.")
            continue

        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()

        response = client.detect_custom_labels(
            Image={"Bytes": image_bytes},
            MinConfidence=MIN_CONFIDENCE,
            ProjectVersionArn=MODEL_ARN,
        )

        labels = [{"Label": label["Name"], "Confidence": label["Confidence"]} for label in response["CustomLabels"]]
        results.append({"image": image_filename, "labels": labels})

    if not results:
        raise HTTPException(status_code=404, detail="No images successfully processed.")

    return {"results": results}
