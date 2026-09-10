from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from predictor import predict_image
from recommendation_engine import generate_recommendations


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="OtitisAI-CDSS",
    description="AI-based Otitis Media Clinical Decision Support System",
    version="1.0.0"
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():

    return {
        "application": "OtitisAI-CDSS",
        "status": "online",
        "version": "1.0.0",
        "message": "OtitisAI-CDSS backend is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "healthy",
        "message": "Diagnosis API is ready"
    }


# =========================================================
# IMAGE DIAGNOSIS ENDPOINT
# =========================================================

@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    symptoms: str = Form(""),
    duration: str = Form(""),
    age: str = Form("")
):

    # -----------------------------------------------------
    # CHECK IMAGE FILE
    # -----------------------------------------------------

    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="Image file type could not be detected."
        )

    if not file.content_type.startswith("image/"):

        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )


    try:

        # -------------------------------------------------
        # READ IMAGE
        # -------------------------------------------------

        image_bytes = await file.read()

        if not image_bytes:

            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )


        # -------------------------------------------------
        # OPEN IMAGE
        # -------------------------------------------------

        try:

            image = Image.open(
                io.BytesIO(image_bytes)
            )

            # Make sure image is completely loaded
            image.load()

        except Exception:

            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid image."
            )


        # -------------------------------------------------
        # RUN AI MODEL
        # -------------------------------------------------

        result = predict_image(image)


        # -------------------------------------------------
        # EXTRACT PREDICTION RESULT
        # -------------------------------------------------

        prediction = result.get(
            "prediction",
            "Unknown"
        )

        class_index = result.get(
            "class_index",
            None
        )

        confidence = result.get(
            "confidence",
            None
        )


        # -------------------------------------------------
        # PROCESS SYMPTOMS
        # -------------------------------------------------

        if symptoms.strip():

            symptom_list = [
                symptom.strip()
                for symptom in symptoms.split(",")
                if symptom.strip()
            ]

        else:

            symptom_list = []


        # -------------------------------------------------
        # GENERATE CLINICAL GUIDANCE
        # -------------------------------------------------

        guidance = generate_recommendations(

            prediction=prediction,

            symptoms=symptom_list,

            duration=duration,

            confidence=confidence

        )


        # -------------------------------------------------
        # CONFIDENCE PERCENTAGE
        # -------------------------------------------------

        confidence_percentage = None

        if confidence is not None:

            try:

                confidence_percentage = round(
                    float(confidence) * 100,
                    2
                )

            except (ValueError, TypeError):

                confidence_percentage = None


        # -------------------------------------------------
        # RETURN COMPLETE RESPONSE
        # -------------------------------------------------

        return {

            "success": True,

            "filename": file.filename,

            "prediction": prediction,

            "class_index": class_index,

            "confidence": confidence,

            "confidence_percentage": confidence_percentage,

            "age": age,

            "symptoms": symptom_list,

            "duration": duration,

            "recommendations": guidance[
                "recommendations"
            ],

            "precautions": guidance[
                "precautions"
            ],

            "when_to_seek_care": guidance[
                "when_to_seek_care"
            ],

            "urgency": guidance[
                "urgency"
            ]

        }


    # -----------------------------------------------------
    # HTTP EXCEPTION
    # -----------------------------------------------------

    except HTTPException:

        raise


    # -----------------------------------------------------
    # GENERAL ERROR
    # -----------------------------------------------------

    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        raise HTTPException(

            status_code=500,

            detail=f"Prediction failed: {str(e)}"

        )


# =========================================================
# RUNNING THE FILE DIRECTLY
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )