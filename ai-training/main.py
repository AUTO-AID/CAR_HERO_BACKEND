import os
import pickle
import numpy as np
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_inference_service")

# Global model variable
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the machine learning model on startup
    global model
    model_path = os.path.join(os.path.dirname(__file__), 'models/provider_recommendation_model.pkl')
    
    if not os.path.exists(model_path):
        logger.error(f"Pickle model not found at path: {model_path}")
        raise FileNotFoundError(f"Model file not found at {model_path}")
        
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        logger.info("RandomForestClassifier model loaded successfully into memory.")
    except Exception as e:
        logger.error(f"Error loading model pickle: {e}")
        raise e
        
    yield
    
    # Clean up resources on shutdown
    logger.info("Shutting down AI inference service.")

app = FastAPI(
    title="Car Hero AI Recommendation Inference Service",
    description="FastAPI Microservice for fast real-time provider recommendation predictions",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for internal microservice communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CandidateFeature(BaseModel):
    providerId: str = Field(..., description="Unique identifier for the service provider")
    distance: float = Field(0.5, ge=0.0, le=1.0, description="Normalized distance score")
    rating: float = Field(0.5, ge=0.0, le=1.0, description="Normalized rating score")
    serviceMatch: float = Field(0.5, ge=0.0, le=1.0, description="Normalized service match score")
    workingHours: float = Field(0.5, ge=0.0, le=1.0, description="Normalized working hours score")
    emergencySupport: float = Field(0.5, ge=0.0, le=1.0, description="Normalized emergency support score")
    expectedResponseTime: float = Field(0.5, ge=0.0, le=1.0, description="Normalized expected response time score")
    completedOrders: float = Field(0.5, ge=0.0, le=1.0, description="Normalized completed orders score")
    cancellationRate: float = Field(0.5, ge=0.0, le=1.0, description="Normalized cancellation rate score")
    cityMatch: float = Field(0.5, ge=0.0, le=1.0, description="Normalized city match score")
    urgencyAlignment: float = Field(0.5, ge=0.0, le=1.0, description="Normalized urgency alignment score")

class PredictRequest(BaseModel):
    candidates: List[CandidateFeature] = Field(..., description="List of provider candidates with their features")

class PredictionResponseItem(BaseModel):
    providerId: str
    score: float

class PredictResponse(BaseModel):
    predictions: List[PredictionResponseItem]

@app.get("/health", tags=["Health"])
async def health_check():
    """Verify service health and model loading status"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_recommendations(request: PredictRequest):
    """
    Predict recommendation scores for candidate providers.
    Maintains model in memory for super-fast inference (< 20ms).
    """
    if model is None:
        logger.error("Prediction requested but model is not loaded.")
        raise HTTPException(status_code=503, detail="AI Model is not initialized yet.")
        
    if not request.candidates:
        return {"predictions": []}
        
    try:
        # Features order must match train/test features exactly:
        feature_names = [
            'distance', 'rating', 'serviceMatch', 'workingHours', 'emergencySupport',
            'expectedResponseTime', 'completedOrders', 'cancellationRate', 'cityMatch', 'urgencyAlignment'
        ]
        
        # Prepare feature matrix X
        X = []
        for candidate in request.candidates:
            # Construct a row using the features in exact order
            row = [getattr(candidate, name) for name in feature_names]
            X.append(row)
            
        # Run inference using loaded sklearn model
        # predict_proba returns probabilities for [class_0, class_1]
        # We need the probability of class 1 (successfulRecommendation)
        probabilities = model.predict_proba(X)[:, 1]
        
        # Build results
        results = []
        for idx, prob in enumerate(probabilities):
            results.append(PredictionResponseItem(
                providerId=request.candidates[idx].providerId,
                score=float(np.round(prob * 100, 2))
            ))
            
        return PredictResponse(predictions=results)
        
    except Exception as e:
        logger.exception("Error occurred during model inference prediction")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/reload", tags=["Inference"])
async def reload_model():
    """Reload the ML model from disk after retraining"""
    global model
    model_path = os.path.join(os.path.dirname(__file__), 'models/provider_recommendation_model.pkl')
    if not os.path.exists(model_path):
        logger.error(f"Model reload failed: Pickle model not found at {model_path}")
        raise HTTPException(status_code=404, detail="Pickle model file not found.")
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        logger.info("RandomForestClassifier model reloaded successfully.")
        return {"status": "success", "message": "Model reloaded successfully."}
    except Exception as e:
        logger.exception("Error occurred during model reloading")
        raise HTTPException(status_code=500, detail=f"Reload error: {str(e)}")

