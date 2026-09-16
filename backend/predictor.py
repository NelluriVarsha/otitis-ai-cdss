# ============================================================
# OtitisAI-CDSS
# Multimodal Otitis Media Predictor
#
# Image Model:
#   DenseNet121 feature extractor
#       ↓
#   Existing KNN classifier
#
# Clinical Layer:
#   Symptoms + duration
#       ↓
#   Clinical evidence scores
#
# Fusion:
#   Image evidence + clinical evidence
#
# IMPORTANT:
# The clinical layer is rule-based supporting evidence.
# It is NOT a separately trained medical model.
# ============================================================

import os
import numpy as np
from PIL import Image

# ============================================================
# TensorFlow / Keras
# ============================================================

from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input

# ============================================================
# Scikit-learn
# ============================================================

import joblib


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

KNN_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "KNN_model.pkl"
)


# ============================================================
# CLASS LABELS
# ============================================================
#
# These MUST match the classes used by the current trained
# KNN model.
#
# Do NOT add new classes here unless the KNN model has actually
# been retrained with those classes.
# ============================================================

CLASS_NAMES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]


# ============================================================
# CLINICAL FEATURES
# ============================================================

CLINICAL_FEATURES = [
    "ear_pain",
    "fever",
    "hearing_loss",
    "ear_discharge",
    "itching",
    "recent_cold",
    "duration_days"
]


# ============================================================
# FUSION WEIGHTS
# ============================================================
#
# Current image model is trained on image features.
# Therefore image evidence remains stronger.
#
# Clinical evidence is supporting evidence.
# ============================================================

IMAGE_WEIGHT = 0.70
CLINICAL_WEIGHT = 0.30


# ============================================================
# CONFIDENCE CALIBRATION
# ============================================================
#
# IMPORTANT:
# Raw KNN probabilities can become 1.0 for some datasets.
# That does NOT necessarily mean the diagnosis is medically
# 100% certain.
#
# We therefore apply a conservative calibration.
# ============================================================

MAX_DISPLAY_CONFIDENCE = 0.95


# ============================================================
# LOAD KNN MODEL
# ============================================================

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


# ============================================================
# LOAD DENSENET121 FEATURE EXTRACTOR
# ============================================================

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


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(image):
    """
    Convert uploaded PIL image into the format
    expected by DenseNet121.
    """

    if not isinstance(image, Image.Image):

        raise TypeError(
            "Expected a PIL Image."
        )

    # Convert to RGB
    image = image.convert("RGB")

    # Resize to project size
    image = image.resize(
        (128, 128)
    )

    # Convert to NumPy
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


# ============================================================
# EXTRACT IMAGE FEATURES
# ============================================================

def extract_features(image):
    """
    Extract DenseNet121 feature vector.
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

    features = np.asarray(
        features,
        dtype=np.float32
    )

    features = features.reshape(
        1,
        -1
    )

    return features


# ============================================================
# NORMALIZE BOOLEAN VALUE
# ============================================================

def normalize_bool(value):
    """
    Convert different frontend/backend boolean formats
    into a reliable Python boolean.
    """

    if isinstance(value, bool):
        return value

    if value is None:
        return False

    if isinstance(value, (int, float)):
        return value != 0

    value = str(value).strip().lower()

    return value in [
        "true",
        "1",
        "yes",
        "y",
        "on",
        "present"
    ]


# ============================================================
# NORMALIZE CLINICAL DATA
# ============================================================

def normalize_clinical_data(
    ear_pain=False,
    fever=False,
    hearing_loss=False,
    ear_discharge=False,
    itching=False,
    recent_cold=False,
    duration_days=0,
    symptoms=None
):
    """
    Convert clinical information into a standard dictionary.
    """

    clinical = {

        "ear_pain":
            normalize_bool(ear_pain),

        "fever":
            normalize_bool(fever),

        "hearing_loss":
            normalize_bool(hearing_loss),

        "ear_discharge":
            normalize_bool(ear_discharge),

        "itching":
            normalize_bool(itching),

        "recent_cold":
            normalize_bool(recent_cold),

        "duration_days":
            0.0
    }


    # --------------------------------------------------------
    # Interpret symptoms list
    # --------------------------------------------------------

    if symptoms is not None:

        if isinstance(
            symptoms,
            str
        ):

            symptoms = [
                item.strip()
                for item in symptoms.split(",")
                if item.strip()
            ]


        if isinstance(
            symptoms,
            (list, tuple, set)
        ):

            normalized_symptoms = {
                str(item)
                .lower()
                .strip()
                .replace("_", " ")
                for item in symptoms
            }


            # Ear pain
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "ear pain",
                    "earache",
                    "pain"
                ]
            ):

                clinical[
                    "ear_pain"
                ] = True


            # Fever
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "fever",
                    "high fever"
                ]
            ):

                clinical[
                    "fever"
                ] = True


            # Hearing loss
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "hearing loss",
                    "hearing difficulty",
                    "reduced hearing"
                ]
            ):

                clinical[
                    "hearing_loss"
                ] = True


            # Ear discharge
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "ear discharge",
                    "discharge",
                    "fluid from ear"
                ]
            ):

                clinical[
                    "ear_discharge"
                ] = True


            # Itching
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "itching",
                    "ear itching"
                ]
            ):

                clinical[
                    "itching"
                ] = True


            # Recent cold
            if any(
                phrase in normalized_symptoms
                for phrase in [
                    "recent cold",
                    "cold",
                    "cough",
                    "respiratory infection"
                ]
            ):

                clinical[
                    "recent_cold"
                ] = True


    # --------------------------------------------------------
    # Duration
    # --------------------------------------------------------

    try:

        if duration_days is None:
            duration_days = 0

        clinical[
            "duration_days"
        ] = float(
            duration_days
        )

    except (
        TypeError,
        ValueError
    ):

        clinical[
            "duration_days"
        ] = 0.0


    # --------------------------------------------------------
    # Keep duration sensible
    # --------------------------------------------------------

    clinical[
        "duration_days"
    ] = max(
        0.0,
        min(
            clinical["duration_days"],
            365.0
        )
    )

    return clinical


# ============================================================
# CLINICAL FEATURE VECTOR
# ============================================================

def encode_clinical_features(
    clinical_data
):
    """
    Convert clinical dictionary into a numerical vector.

    Shape:
        (1, 7)
    """

    duration = float(
        clinical_data.get(
            "duration_days",
            0.0
        )
    )

    # Normalize duration
    duration_normalized = min(
        duration / 30.0,
        1.0
    )

    vector = np.array(
        [

            float(
                clinical_data.get(
                    "ear_pain",
                    False
                )
            ),

            float(
                clinical_data.get(
                    "fever",
                    False
                )
            ),

            float(
                clinical_data.get(
                    "hearing_loss",
                    False
                )
            ),

            float(
                clinical_data.get(
                    "ear_discharge",
                    False
                )
            ),

            float(
                clinical_data.get(
                    "itching",
                    False
                )
            ),

            float(
                clinical_data.get(
                    "recent_cold",
                    False
                )
            ),

            duration_normalized

        ],
        dtype=np.float32
    )

    return vector.reshape(
        1,
        -1
    )


# ============================================================
# GET MODEL CLASS INDEX
# ============================================================

def get_model_class_index(
    predicted_class
):
    """
    Convert model class label into a stable class index.
    """

    model_classes = getattr(
        knn_model,
        "classes_",
        None
    )

    # --------------------------------------------------------
    # If model exposes classes_
    # --------------------------------------------------------

    if model_classes is not None:

        try:

            classes_list = list(
                model_classes
            )

            if predicted_class in classes_list:

                position = classes_list.index(
                    predicted_class
                )

                # If class itself is a valid integer index
                try:

                    numeric_class = int(
                        predicted_class
                    )

                    if (
                        0 <= numeric_class
                        < len(CLASS_NAMES)
                    ):

                        return numeric_class

                except Exception:

                    pass

                # Otherwise use position
                return position

        except Exception:

            pass


    # --------------------------------------------------------
    # Direct integer
    # --------------------------------------------------------

    try:

        numeric_class = int(
            predicted_class
        )

        if (
            0 <= numeric_class
            < len(CLASS_NAMES)
        ):

            return numeric_class

    except Exception:

        pass


    return None


# ============================================================
# GET CLASS NAME
# ============================================================

def get_class_name(
    class_index,
    predicted_class=None
):
    """
    Safely convert model output into a class name.
    """

    # --------------------------------------------------------
    # Direct index
    # --------------------------------------------------------

    if (
        isinstance(
            class_index,
            (int, np.integer)
        )
        and
        0 <= int(class_index)
        < len(CLASS_NAMES)
    ):

        return CLASS_NAMES[
            int(class_index)
        ]


    # --------------------------------------------------------
    # Try model classes
    # --------------------------------------------------------

    if predicted_class is not None:

        model_classes = getattr(
            knn_model,
            "classes_",
            []
        )

        try:

            model_classes = list(
                model_classes
            )

            model_position = model_classes.index(
                predicted_class
            )

            if (
                0 <= model_position
                < len(CLASS_NAMES)
            ):

                return CLASS_NAMES[
                    model_position
                ]

        except Exception:

            pass


    return "Unknown"


# ============================================================
# IMAGE MODEL PROBABILITIES
# ============================================================

def get_image_probabilities(
    features
):
    """
    Obtain KNN class probabilities.

    Returns:
        dictionary {class_name: probability}
    """

    probabilities = {
        class_name: 0.0
        for class_name in CLASS_NAMES
    }


    if knn_model is None:
        return probabilities


    # --------------------------------------------------------
    # Preferred: predict_proba
    # --------------------------------------------------------

    if hasattr(
        knn_model,
        "predict_proba"
    ):

        try:

            raw_probabilities = (
                knn_model.predict_proba(
                    features
                )
            )

            if (
                raw_probabilities is not None
                and
                len(raw_probabilities) > 0
            ):

                row = np.asarray(
                    raw_probabilities[0],
                    dtype=float
                )

                model_classes = getattr(
                    knn_model,
                    "classes_",
                    None
                )

                if model_classes is not None:

                    for index, probability in enumerate(row):

                        if index >= len(model_classes):
                            continue

                        model_class = model_classes[index]

                        class_index = (
                            get_model_class_index(
                                model_class
                            )
                        )

                        if class_index is None:
                            continue

                        if (
                            0 <= class_index
                            < len(CLASS_NAMES)
                        ):

                            probabilities[
                                CLASS_NAMES[class_index]
                            ] = max(
                                0.0,
                                float(probability)
                            )

        except Exception as e:

            print(
                "KNN predict_proba error:",
                str(e)
            )


    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    total = sum(
        probabilities.values()
    )

    if total > 0:

        probabilities = {
            key:
                value / total
            for key, value
            in probabilities.items()
        }


    return probabilities


# ============================================================
# CALIBRATE IMAGE CONFIDENCE
# ============================================================

def calibrate_confidence(
    raw_confidence
):
    """
    Prevent raw KNN probability from being interpreted
    as medical certainty.

    This is a conservative display calibration, NOT
    statistical probability calibration.
    """

    try:

        value = float(
            raw_confidence
        )

    except Exception:

        return 0.0


    value = max(
        0.0,
        min(
            value,
            1.0
        )
    )


    # --------------------------------------------------------
    # Compress extremely high probabilities
    #
    # Example:
    #
    # 1.00 -> 0.95
    # 0.95 -> ~0.91
    # 0.80 -> ~0.76
    #
    # This avoids presenting KNN certainty as medical
    # certainty.
    # --------------------------------------------------------

    calibrated = (
        0.15 +
        (value * 0.80)
    )


    calibrated = max(
        0.0,
        min(
            calibrated,
            MAX_DISPLAY_CONFIDENCE
        )
    )

    return calibrated


# ============================================================
# IMAGE-ONLY PREDICTION
# ============================================================

def predict_image(
    image
):
    """
    Perform image-only prediction.
    """

    if knn_model is None:

        raise RuntimeError(
            "KNN model could not be loaded. "
            "Check backend/model/KNN_model.pkl."
        )


    # --------------------------------------------------------
    # Extract features
    # --------------------------------------------------------

    features = extract_features(
        image
    )


    # --------------------------------------------------------
    # Validate feature size
    # --------------------------------------------------------

    expected_features = getattr(
        knn_model,
        "n_features_in_",
        None
    )

    actual_features = features.shape[1]

    if (
        expected_features is not None
        and
        actual_features != expected_features
    ):

        raise RuntimeError(
            "Feature size mismatch. "
            f"KNN model expects "
            f"{expected_features} features, "
            f"but DenseNet produced "
            f"{actual_features} features."
        )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    predicted_class = knn_model.predict(
        features
    )[0]


    # --------------------------------------------------------
    # Convert class
    # --------------------------------------------------------

    class_index = get_model_class_index(
        predicted_class
    )

    prediction = get_class_name(
        class_index,
        predicted_class
    )


    if prediction == "Unknown":

        raise RuntimeError(
            "The KNN model returned an unsupported class: "
            f"{predicted_class}"
        )


    # --------------------------------------------------------
    # Get probabilities
    # --------------------------------------------------------

    probabilities = get_image_probabilities(
        features
    )


    raw_confidence = probabilities.get(
        prediction,
        0.0
    )


    # --------------------------------------------------------
    # Calibrated confidence
    # --------------------------------------------------------

    calibrated_confidence = calibrate_confidence(
        raw_confidence
    )


    return {

        "prediction":
            prediction,

        "class_index":
            int(class_index),

        "confidence":
            round(
                calibrated_confidence,
                4
            ),

        "raw_confidence":
            round(
                float(raw_confidence),
                4
            ),

        "probabilities":
            {
                key:
                    round(
                        float(value),
                        4
                    )
                for key, value
                in probabilities.items()
            }
    }


# ============================================================
# CLINICAL EVIDENCE SCORES
# ============================================================

def calculate_clinical_scores(
    clinical_data
):
    """
    Calculate rule-based clinical evidence.

    IMPORTANT:
    These are NOT trained probabilities.
    They are supporting evidence only.
    """

    scores = {

        "Acute Otitis Media":
            0.0,

        "Cerumen Impaction":
            0.0,

        "Chronic Otitis Media":
            0.0,

        "Myringosclerosis":
            0.0,

        "Normal":
            0.0
    }


    ear_pain = clinical_data.get(
        "ear_pain",
        False
    )

    fever = clinical_data.get(
        "fever",
        False
    )

    hearing_loss = clinical_data.get(
        "hearing_loss",
        False
    )

    ear_discharge = clinical_data.get(
        "ear_discharge",
        False
    )

    itching = clinical_data.get(
        "itching",
        False
    )

    recent_cold = clinical_data.get(
        "recent_cold",
        False
    )

    duration_days = clinical_data.get(
        "duration_days",
        0.0
    )


    # ========================================================
    # ACUTE OTITIS MEDIA
    # ========================================================

    if ear_pain:

        scores[
            "Acute Otitis Media"
        ] += 0.30


    if fever:

        scores[
            "Acute Otitis Media"
        ] += 0.25


    if recent_cold:

        scores[
            "Acute Otitis Media"
        ] += 0.20


    if hearing_loss:

        scores[
            "Acute Otitis Media"
        ] += 0.10


    if (
        duration_days > 0
        and
        duration_days <= 7
    ):

        scores[
            "Acute Otitis Media"
        ] += 0.15


    # ========================================================
    # CHRONIC OTITIS MEDIA
    # ========================================================

    if ear_discharge:

        scores[
            "Chronic Otitis Media"
        ] += 0.35


    if hearing_loss:

        scores[
            "Chronic Otitis Media"
        ] += 0.15


    if duration_days >= 30:

        scores[
            "Chronic Otitis Media"
        ] += 0.30


    if (
        ear_pain
        and
        duration_days >= 30
    ):

        scores[
            "Chronic Otitis Media"
        ] += 0.10


    # ========================================================
    # CERUMEN IMPACTION
    # ========================================================

    if hearing_loss:

        scores[
            "Cerumen Impaction"
        ] += 0.25


    if itching:

        scores[
            "Cerumen Impaction"
        ] += 0.20


    if not fever:

        scores[
            "Cerumen Impaction"
        ] += 0.10


    if not ear_pain:

        scores[
            "Cerumen Impaction"
        ] += 0.05


    # ========================================================
    # MYRINGOSCLEROSIS
    # ========================================================

    if hearing_loss:

        scores[
            "Myringosclerosis"
        ] += 0.15


    if duration_days >= 30:

        scores[
            "Myringosclerosis"
        ] += 0.20


    # ========================================================
    # NORMAL
    # ========================================================

    if (
        not ear_pain
        and
        not fever
        and
        not hearing_loss
        and
        not ear_discharge
        and
        not itching
        and
        not recent_cold
    ):

        scores[
            "Normal"
        ] += 0.70


    return scores


# ============================================================
# NORMALIZE SCORE DICTIONARY
# ============================================================

def normalize_scores(
    scores
):
    """
    Normalize scores so their sum equals 1.
    """

    cleaned = {

        class_name:
            max(
                0.0,
                float(
                    scores.get(
                        class_name,
                        0.0
                    )
                )
            )

        for class_name in CLASS_NAMES
    }


    total = sum(
        cleaned.values()
    )


    if total <= 0:

        return {
            class_name: 0.0
            for class_name in CLASS_NAMES
        }


    return {

        class_name:
            value / total

        for class_name, value
        in cleaned.items()
    }


# ============================================================
# MULTIMODAL PREDICTION
# ============================================================

def predict_multimodal(
    image,
    symptoms=None,
    ear_pain=False,
    fever=False,
    hearing_loss=False,
    ear_discharge=False,
    itching=False,
    recent_cold=False,
    duration_days=0
):
    """
    Multimodal prediction.

    Image:
        DenseNet121 + KNN

    Clinical:
        Rule-based evidence

    Fusion:
        70% image
        30% clinical

    IMPORTANT:
    This is an engineering fusion layer, not a trained
    multimodal neural network.
    """


    # ========================================================
    # IMAGE PREDICTION
    # ========================================================

    image_result = predict_image(
        image
    )


    image_prediction = (
        image_result[
            "prediction"
        ]
    )

    image_confidence = float(
        image_result[
            "confidence"
        ]
    )


    raw_image_confidence = float(
        image_result[
            "raw_confidence"
        ]
    )


    image_probabilities = (
        image_result[
            "probabilities"
        ]
    )


    # ========================================================
    # CLINICAL DATA
    # ========================================================

    clinical_data = normalize_clinical_data(

        ear_pain=ear_pain,

        fever=fever,

        hearing_loss=hearing_loss,

        ear_discharge=ear_discharge,

        itching=itching,

        recent_cold=recent_cold,

        duration_days=duration_days,

        symptoms=symptoms
    )


    # ========================================================
    # CLINICAL VECTOR
    # ========================================================

    clinical_vector = (
        encode_clinical_features(
            clinical_data
        )
    )


    # ========================================================
    # CLINICAL SCORES
    # ========================================================

    clinical_scores_raw = (
        calculate_clinical_scores(
            clinical_data
        )
    )


    clinical_scores = normalize_scores(
        clinical_scores_raw
    )


    # ========================================================
    # IMAGE SCORE NORMALIZATION
    # ========================================================

    image_scores = {

        class_name:
            float(
                image_probabilities.get(
                    class_name,
                    0.0
                )
            )

        for class_name in CLASS_NAMES
    }


    image_scores = normalize_scores(
        image_scores
    )


    # ========================================================
    # COMBINE IMAGE + CLINICAL
    # ========================================================

    combined_scores = {}

    for class_name in CLASS_NAMES:

        image_component = (
            image_scores.get(
                class_name,
                0.0
            )
            * IMAGE_WEIGHT
        )

        clinical_component = (
            clinical_scores.get(
                class_name,
                0.0
            )
            * CLINICAL_WEIGHT
        )

        combined_scores[
            class_name
        ] = (
            image_component
            +
            clinical_component
        )


    # ========================================================
    # NORMALIZE FINAL SCORES
    # ========================================================

    combined_scores = normalize_scores(
        combined_scores
    )


    # ========================================================
    # FINAL PREDICTION
    # ========================================================

    final_prediction = max(
        combined_scores,
        key=combined_scores.get
    )


    final_confidence = float(
        combined_scores.get(
            final_prediction,
            0.0
        )
    )


    # ========================================================
    # ADD A SMALL CALIBRATION LIMIT
    # ========================================================
    #
    # A normalized score is NOT automatically a medical
    # probability. We keep the display conservative.
    # ========================================================

    display_confidence = min(
        final_confidence,
        MAX_DISPLAY_CONFIDENCE
    )


    # ========================================================
    # CLASS INDEX
    # ========================================================

    final_class_index = (
        CLASS_NAMES.index(
            final_prediction
        )
    )


    # ========================================================
    # CLINICAL VECTOR
    # ========================================================

    clinical_vector_list = (
        clinical_vector[0]
        .astype(float)
        .tolist()
    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {

        # ----------------------------------------------------
        # Final diagnosis
        # ----------------------------------------------------

        "prediction":
            final_prediction,

        "diagnosis":
            final_prediction,

        "class_index":
            final_class_index,


        # ----------------------------------------------------
        # Final confidence
        # ----------------------------------------------------

        "confidence":
            round(
                display_confidence,
                4
            ),

        "confidence_percentage":
            round(
                display_confidence * 100,
                2
            ),


        # ----------------------------------------------------
        # Confidence information
        # ----------------------------------------------------

        "confidence_type":
            "Calibrated engineering score — not a medical probability",


        # ----------------------------------------------------
        # Image result
        # ----------------------------------------------------

        "image_prediction":
            image_prediction,

        "image_confidence":
            round(
                image_confidence,
                4
            ),

        "image_confidence_percentage":
            round(
                image_confidence * 100,
                2
            ),

        "raw_image_confidence":
            round(
                raw_image_confidence,
                4
            ),


        # ----------------------------------------------------
        # Clinical information
        # ----------------------------------------------------

        "clinical_data":
            clinical_data,

        "clinical_features":
            clinical_vector_list,


        # ----------------------------------------------------
        # Clinical evidence
        # ----------------------------------------------------

        "clinical_scores":
            {
                key:
                    round(
                        float(value),
                        4
                    )

                for key, value
                in clinical_scores.items()
            },


        # ----------------------------------------------------
        # Image evidence
        # ----------------------------------------------------

        "image_scores":
            {
                key:
                    round(
                        float(value),
                        4
                    )

                for key, value
                in image_scores.items()
            },


        # ----------------------------------------------------
        # Final multimodal scores
        # ----------------------------------------------------

        "combined_scores":
            {
                key:
                    round(
                        float(value),
                        4
                    )

                for key, value
                in combined_scores.items()
            },


        # ----------------------------------------------------
        # Fusion information
        # ----------------------------------------------------

        "fusion_weights": {

            "image":
                IMAGE_WEIGHT,

            "clinical":
                CLINICAL_WEIGHT

        },


        "analysis_type":
            "Image + Clinical Data"
    }


# ============================================================
# COMPONENT TEST
# ============================================================

def test_multimodal_components():
    """
    Test whether the multimodal components are available.
    """

    print(
        "\n========================================"
    )

    print(
        "OtitisAI-CDSS Multimodal Components"
    )

    print(
        "========================================"
    )

    print(
        "KNN model loaded:",
        knn_model is not None
    )

    print(
        "DenseNet121 loaded:",
        feature_extractor is not None
    )

    print(
        "Clinical features:",
        CLINICAL_FEATURES
    )

    print(
        "Supported classes:",
        CLASS_NAMES
    )

    print(
        "Image weight:",
        IMAGE_WEIGHT
    )

    print(
        "Clinical weight:",
        CLINICAL_WEIGHT
    )

    print(
        "Maximum display confidence:",
        MAX_DISPLAY_CONFIDENCE
    )

    print(
        "========================================\n"
    )


# ============================================================
# DIRECT EXECUTION
# ============================================================

if __name__ == "__main__":

    test_multimodal_components()