import os
import numpy as np
from PIL import Image

# TensorFlow / Keras
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input

# Scikit-learn
import joblib


# =========================================================
# PATH CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

KNN_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "KNN_model.pkl"
)


# =========================================================
# CLASS LABELS
# =========================================================
# IMPORTANT:
# These are the classes supported by your existing model.
# Do NOT change these to the newer 8-class list unless
# you retrain the model with those classes.

CLASS_NAMES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]


# =========================================================
# LOAD KNN MODEL
# =========================================================

knn_model = None

try:

    if not os.path.exists(KNN_MODEL_PATH):

        print(
            f"WARNING: KNN model not found at: "
            f"{KNN_MODEL_PATH}"
        )

    else:

        knn_model = joblib.load(
            KNN_MODEL_PATH
        )

        print(
            "KNN model loaded successfully."
        )

        print(
            "Model classes:",
            getattr(
                knn_model,
                "classes_",
                "Unknown"
            )
        )

        print(
            "Model features:",
            getattr(
                knn_model,
                "n_features_in_",
                "Unknown"
            )
        )

except Exception as e:

    print(
        "ERROR loading KNN model:",
        str(e)
    )

    knn_model = None


# =========================================================
# LOAD DENSENET121 FEATURE EXTRACTOR
# =========================================================

feature_extractor = None

try:

    print(
        "Loading DenseNet121 feature extractor..."
    )

    feature_extractor = DenseNet121(
        weights="imagenet",
        include_top=False,
        pooling="avg"
    )

    print(
        "DenseNet121 loaded successfully."
    )

except Exception as e:

    print(
        "ERROR loading DenseNet121:",
        str(e)
    )

    feature_extractor = None


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

def preprocess_image(image):
    """
    Convert uploaded PIL image into the format
    expected by DenseNet121.
    """

    # Convert image to RGB
    image = image.convert("RGB")

    # Resize to the same size used by the original project
    image = image.resize(
        (128, 128)
    )

    # Convert to NumPy array
    image_array = np.array(
        image,
        dtype=np.float32
    )

    # Add batch dimension
    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    # DenseNet preprocessing
    image_array = preprocess_input(
        image_array
    )

    return image_array


# =========================================================
# EXTRACT IMAGE FEATURES
# =========================================================

def extract_features(image):
    """
    Extract DenseNet121 features from an image.
    """

    if feature_extractor is None:

        raise RuntimeError(
            "DenseNet121 feature extractor is not available."
        )

    processed_image = preprocess_image(
        image
    )

    features = feature_extractor.predict(
        processed_image,
        verbose=0
    )

    # Convert to 1D feature vector
    features = features.reshape(
        1,
        -1
    )

    return features


# =========================================================
# CALCULATE CONFIDENCE
# =========================================================

def calculate_confidence(features):
    """
    Calculate a confidence-like score for the KNN prediction.

    For the existing KNN model, confidence is estimated from
    the neighbor votes/distances rather than from a trained
    probability output.

    Returns a value between 0 and 1.
    """

    if knn_model is None:

        return 0.0

    try:

        # Preferred method: predict_proba
        if hasattr(
            knn_model,
            "predict_proba"
        ):

            probabilities = (
                knn_model.predict_proba(
                    features
                )
            )

            if probabilities.size > 0:

                confidence = float(
                    np.max(probabilities[0])
                )

                return max(
                    0.0,
                    min(
                        confidence,
                        1.0
                    )
                )

    except Exception as e:

        print(
            "predict_proba confidence error:",
            str(e)
        )


    # -----------------------------------------------------
    # FALLBACK: USE NEIGHBOR DISTANCES
    # -----------------------------------------------------

    try:

        distances, _ = (
            knn_model.kneighbors(
                features
            )
        )

        if distances.size == 0:

            return 0.0

        mean_distance = float(
            np.mean(
                distances[0]
            )
        )

        # Convert distance into a simple bounded score
        confidence = 1.0 / (
            1.0 + mean_distance
        )

        return max(
            0.0,
            min(
                confidence,
                1.0
            )
        )

    except Exception as e:

        print(
            "Distance confidence error:",
            str(e)
        )

        return 0.0


# =========================================================
# PREDICT IMAGE
# =========================================================

def predict_image(image):
    """
    Main prediction function.

    Input:
        PIL.Image

    Output:
        Dictionary containing:
        - prediction
        - class_index
        - confidence
    """

    # -----------------------------------------------------
    # CHECK MODEL
    # -----------------------------------------------------

    if knn_model is None:

        raise RuntimeError(
            "KNN model could not be loaded. "
            "Check backend/model/KNN_model.pkl."
        )


    # -----------------------------------------------------
    # EXTRACT FEATURES
    # -----------------------------------------------------

    features = extract_features(
        image
    )


    # -----------------------------------------------------
    # CHECK FEATURE SIZE
    # -----------------------------------------------------

    expected_features = getattr(
        knn_model,
        "n_features_in_",
        None
    )

    actual_features = features.shape[1]

    if (
        expected_features is not None
        and actual_features != expected_features
    ):

        raise RuntimeError(

            "Feature size mismatch. "

            f"KNN model expects "
            f"{expected_features} features, "

            f"but DenseNet produced "
            f"{actual_features} features."

        )


    # -----------------------------------------------------
    # PREDICT CLASS
    # -----------------------------------------------------

    predicted_class = knn_model.predict(
        features
    )[0]


    # Convert NumPy integer to normal Python integer
    try:

        class_index = int(
            predicted_class
        )

    except Exception:

        class_index = predicted_class


    # -----------------------------------------------------
    # GET CLASS NAME
    # -----------------------------------------------------

    if (
        isinstance(class_index, int)
        and 0 <= class_index < len(CLASS_NAMES)
    ):

        prediction = CLASS_NAMES[
            class_index
        ]

    else:

        # Try model classes if available
        model_classes = getattr(
            knn_model,
            "classes_",
            []
        )

        try:

            model_position = list(
                model_classes
            ).index(
                predicted_class
            )

            prediction = CLASS_NAMES[
                model_position
            ]

        except Exception:

            prediction = "Unknown"


    # -----------------------------------------------------
    # CONFIDENCE
    # -----------------------------------------------------

    confidence = calculate_confidence(
        features
    )


    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {

        "prediction": prediction,

        "class_index": class_index,

        "confidence": round(
            float(confidence),
            4
        )

    }