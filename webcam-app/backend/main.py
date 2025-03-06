from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3


app = FastAPI()

# Allow frontend (Next.js at localhost:3000) to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend requests
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
rekognition = boto3.client('rekognition', region_name='us-east-1')

PROJECT_VERSION_ARN = "arn:aws:rekognition:us-east-1:139008108936:project/demo/version/v1/1740458446514"
PROJECT_ARN = "arn:aws:rekognition:us-east-1:139008108936:project/demo/1740458446514"

@app.options("/start-model")
@app.options("/stop-model")
@app.options("/check-model-status")
def preflight():
    return {"message": "Preflight request success"}

@app.get("/")
def root():
    return {"message": "FastAPI server is running!"}

@app.get("/start-model")
def start_model():
    try:
        response = rekognition.start_project_version(
            ProjectVersionArn=PROJECT_VERSION_ARN,
            MinInferenceUnits=1
        )
        return {"message": "Model is starting..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stop-model")
def stop_model():
    try:
        response = rekognition.stop_project_version(
            ProjectVersionArn=PROJECT_VERSION_ARN
        )
        return {"message": "Model is stopping..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-model-status")
def check_model_status():
    try:
        response = rekognition.describe_project_versions(ProjectArn=PROJECT_ARN)
        status = response["ProjectVersionDescriptions"][0]["Status"]
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
