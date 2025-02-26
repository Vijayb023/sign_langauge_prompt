from fastapi import FastAPI, HTTPException
import boto3
import os

app = FastAPI()

# AWS Rekognition Client
rekognition = boto3.client('rekognition', region_name='us-east-1')

@app.post("/process-image")
async def process_image(data: dict):
    image_path = data.get("image_path")
    if not image_path:
        raise HTTPException(status_code=400, detail="No image path provided")

    try:
        print(f"🔹 Received image path: {image_path}")

        # Ensure path is correct
        image_full_path = f"../public{image_path}"
        if not os.path.exists(image_full_path):
            print("❌ Image file not found:", image_full_path)
            raise HTTPException(status_code=404, detail="Image file not found")

        # Read image as bytes
        with open(image_full_path, "rb") as image_file:
            image_bytes = image_file.read()

        # Call AWS Rekognition
        response = rekognition.detect_labels(
            Image={"Bytes": image_bytes},
            MaxLabels=5
        )

        print("✅ Rekognition Response:", response)
        return {"labels": response["Labels"]}

    except Exception as e:
        print("❌ Error processing image:", str(e))
        raise HTTPException(status_code=500, detail="AWS Rekognition processing failed")
