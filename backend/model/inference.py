# ============================================================
# OtitisAI-CDSS
# Complete Multimodal Inference Engine
#
# Image:
#   Vision Transformer -> 768 features
#
# Clinical:
#   Clinical Encoder -> 128 features
#
# Fusion:
#   768 + 128 = 896
#   Feature Fusion -> 512
#   Attention -> 512
#
# Outputs:
#   Disease -> 5 classes
#   Severity -> 3 classes
# ============================================================

import os
import sys
import json

import numpy as np
import torch
import torch.nn as nn
from PIL import Image


# ============================================================
# PROJECT PATH
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ============================================================
# IMPORT EXISTING COMPONENTS
# ============================================================

from model.vit_model import ViTFeatureExtractor
from model.clinical_encoder import (
    ClinicalEncoder,
    prepare_clinical_features
)


# ============================================================
# CLASS NAMES
# ============================================================

DISEASE_CLASSES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]

SEVERITY_CLASSES = [
    "Mild",
    "Moderate",
    "Severe"
]


# ============================================================
# TRAINED MODEL ARCHITECTURE
# ============================================================

class TrainedMultimodalNetwork(nn.Module):
    """
    Architecture matching the model used during training.

    Image features:
        768

    Clinical features:
        128

    Fused:
        896

    Fusion:
        896 -> 512

    Attention:
        512 -> 256 -> 512

    Disease:
        512 -> 256 -> 5

    Severity:
        512 -> 128 -> 3
    """

    def __init__(
        self,
        image_feature_size=768,
        clinical_feature_size=128,
        fused_feature_size=512,
        num_diseases=5,
        num_severity=3
    ):
        super().__init__()

        # ----------------------------------------------------
        # Clinical Encoder
        # ----------------------------------------------------

        self.clinical_encoder = ClinicalEncoder(
            input_size=8,
            hidden_size=32,
            output_size=clinical_feature_size
        )

        # ----------------------------------------------------
        # Feature Fusion
        # ----------------------------------------------------

        self.fusion = nn.Sequential(
            nn.Linear(
                image_feature_size + clinical_feature_size,
                fused_feature_size
            ),
            nn.ReLU(),
            nn.Dropout(0.2)
        )

        # ----------------------------------------------------
        # Attention
        # ----------------------------------------------------

        self.attention = nn.Sequential(
            nn.Linear(
                fused_feature_size,
                256
            ),
            nn.Tanh(),

            nn.Linear(
                256,
                fused_feature_size
            ),

            nn.Sigmoid()
        )

        # ----------------------------------------------------
        # Disease Prediction Head
        # ----------------------------------------------------

        self.disease_head = nn.Sequential(
            nn.Linear(
                fused_feature_size,
                256
            ),
            nn.ReLU(),

            nn.Dropout(0.2),

            nn.Linear(
                256,
                num_diseases
            )
        )

        # ----------------------------------------------------
        # Severity Prediction Head
        # ----------------------------------------------------

        self.severity_head = nn.Sequential(
            nn.Linear(
                fused_feature_size,
                128
            ),
            nn.ReLU(),

            nn.Linear(
                128,
                num_severity
            )
        )


# ============================================================
# INFERENCE ENGINE
# ============================================================

class OtitisInferenceEngine:

    def __init__(self):

        print()
        print("=" * 60)
        print("Initializing OtitisAI-CDSS Inference Engine")
        print("=" * 60)

        # ----------------------------------------------------
        # Device
        # ----------------------------------------------------

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print("Device:", self.device)

        # ----------------------------------------------------
        # Paths
        # ----------------------------------------------------

        self.model_path = os.path.join(
            PROJECT_ROOT,
            "trained_models",
            "multimodal_best.pth"
        )

        self.config_path = os.path.join(
            PROJECT_ROOT,
            "trained_models",
            "model_config.json"
        )

        # ----------------------------------------------------
        # Classes
        # ----------------------------------------------------

        self.disease_classes = DISEASE_CLASSES
        self.severity_classes = SEVERITY_CLASSES

        # ----------------------------------------------------
        # Load configuration
        # ----------------------------------------------------

        self.load_config()

        # ----------------------------------------------------
        # Load ViT
        # ----------------------------------------------------

        print()
        print("Loading Vision Transformer...")

        self.vit = ViTFeatureExtractor()

        print("Vision Transformer ready.")

        # ----------------------------------------------------
        # Load Clinical Encoder
        # ----------------------------------------------------

        print("Loading Clinical Encoder...")

        self.clinical_encoder = ClinicalEncoder(
            input_size=8,
            hidden_size=32,
            output_size=128
        )

        self.clinical_encoder = (
            self.clinical_encoder
            .to(self.device)
        )

        self.clinical_encoder.eval()

        print("Clinical Encoder ready.")

        # ----------------------------------------------------
        # Load trained multimodal network
        # ----------------------------------------------------

        self.load_trained_model()

        print()
        print("=" * 60)
        print("INFERENCE ENGINE READY")
        print("=" * 60)


    # ========================================================
    # LOAD CONFIG
    # ========================================================

    def load_config(self):

        self.config = {}

        if os.path.exists(self.config_path):

            try:

                with open(
                    self.config_path,
                    "r",
                    encoding="utf-8"
                ) as f:

                    self.config = json.load(f)

                print("Model configuration loaded.")

            except Exception as e:

                print(
                    "Warning: Could not read model_config.json:",
                    e
                )

        else:

            print(
                "Warning: model_config.json not found."
            )


    # ========================================================
    # LOAD TRAINED MODEL
    # ========================================================

    def load_trained_model(self):

        print()
        print("Loading trained model:")
        print(self.model_path)

        if not os.path.exists(self.model_path):

            raise FileNotFoundError(
                "\nTrained model not found:\n"
                + self.model_path
                + "\n\nPlease run:\n"
                "python .\\training\\train_multimodal.py"
            )

        # ----------------------------------------------------
        # Create architecture
        # ----------------------------------------------------

        self.model = TrainedMultimodalNetwork(
            image_feature_size=768,
            clinical_feature_size=128,
            fused_feature_size=512,
            num_diseases=len(self.disease_classes),
            num_severity=len(self.severity_classes)
        )

        # ----------------------------------------------------
        # Load checkpoint
        # ----------------------------------------------------

        checkpoint = torch.load(
            self.model_path,
            map_location=self.device,
            weights_only=False
        )

        # ----------------------------------------------------
        # Determine state dictionary
        # ----------------------------------------------------

        if isinstance(checkpoint, dict):

            if "model_state_dict" in checkpoint:

                state_dict = checkpoint[
                    "model_state_dict"
                ]

            elif "state_dict" in checkpoint:

                state_dict = checkpoint[
                    "state_dict"
                ]

            else:

                state_dict = checkpoint

        else:

            state_dict = checkpoint

        # ----------------------------------------------------
        # Remove possible DataParallel prefix
        # ----------------------------------------------------

        cleaned_state_dict = {}

        for key, value in state_dict.items():

            if key.startswith("module."):

                new_key = key[7:]

            else:

                new_key = key

            cleaned_state_dict[new_key] = value

        # ----------------------------------------------------
        # Load weights
        # ----------------------------------------------------

        try:

            self.model.load_state_dict(
                cleaned_state_dict,
                strict=True
            )

        except RuntimeError as e:

            print()
            print("Strict model loading failed.")
            print("Trying compatible loading...")

            result = self.model.load_state_dict(
                cleaned_state_dict,
                strict=False
            )

            print(
                "Missing keys:",
                result.missing_keys
            )

            print(
                "Unexpected keys:",
                result.unexpected_keys
            )

        # ----------------------------------------------------
        # Device + evaluation
        # ----------------------------------------------------

        self.model = self.model.to(
            self.device
        )

        self.model.eval()

        print(
            "Trained multimodal model loaded successfully."
        )


    # ========================================================
    # IMAGE FEATURE EXTRACTION
    # ========================================================

    def extract_image_features(
        self,
        image
    ):

        # ----------------------------------------------------
        # Accept:
        #   PIL Image
        #   image path
        # ----------------------------------------------------

        if isinstance(image, str):

            if not os.path.exists(image):

                raise FileNotFoundError(
                    "Image not found: " + image
                )

            image = Image.open(
                image
            ).convert("RGB")

        elif isinstance(image, Image.Image):

            image = image.convert("RGB")

        else:

            raise TypeError(
                "image must be a file path "
                "or PIL.Image.Image"
            )

        # ----------------------------------------------------
        # ViT feature extraction
        # ----------------------------------------------------

        features = self.vit.extract_features(
            image
        )

        # ----------------------------------------------------
        # Convert to numpy
        # ----------------------------------------------------

        if isinstance(features, torch.Tensor):

            features = (
                features
                .detach()
                .cpu()
                .numpy()
            )

        else:

            features = np.asarray(
                features,
                dtype=np.float32
            )

        # ----------------------------------------------------
        # Flatten
        # ----------------------------------------------------

        features = features.reshape(-1)

        # ----------------------------------------------------
        # Verify dimension
        # ----------------------------------------------------

        if features.shape[0] != 768:

            raise ValueError(
                "Unexpected ViT feature size: "
                + str(features.shape)
                + ". Expected 768."
            )

        return features.astype(
            np.float32
        )


    # ========================================================
    # CLINICAL FEATURE EXTRACTION
    # ========================================================

    def extract_clinical_features(
        self,
        age=0,
        ear_pain=False,
        fever=False,
        hearing_loss=False,
        ear_discharge=False,
        itching=False,
        recent_cold=False,
        duration_days=0
    ):

        clinical_input = prepare_clinical_features(

            age=age,

            ear_pain=ear_pain,

            fever=fever,

            hearing_loss=hearing_loss,

            ear_discharge=ear_discharge,

            itching=itching,

            recent_cold=recent_cold,

            duration_days=duration_days
        )

        # ----------------------------------------------------
        # Make tensor
        # ----------------------------------------------------

        if not isinstance(
            clinical_input,
            torch.Tensor
        ):

            clinical_input = torch.tensor(
                clinical_input,
                dtype=torch.float32
            )

        clinical_input = (
            clinical_input
            .float()
            .to(self.device)
        )

        # ----------------------------------------------------
        # Batch dimension
        # ----------------------------------------------------

        if clinical_input.dim() == 1:

            clinical_input = (
                clinical_input
                .unsqueeze(0)
            )

        # ----------------------------------------------------
        # Encode
        # ----------------------------------------------------

        with torch.no_grad():

            clinical_features = (
                self.clinical_encoder(
                    clinical_input
                )
            )

        clinical_features = (
            clinical_features
            .squeeze(0)
            .detach()
            .cpu()
            .numpy()
        )

        clinical_features = (
            clinical_features
            .reshape(-1)
            .astype(np.float32)
        )

        # ----------------------------------------------------
        # Verify
        # ----------------------------------------------------

        if clinical_features.shape[0] != 128:

            raise ValueError(
                "Unexpected clinical feature size: "
                + str(clinical_features.shape)
                + ". Expected 128."
            )

        return clinical_features


    # ========================================================
    # PREDICT
    # ========================================================

    def predict(

        self,

        image,

        age=0,

        ear_pain=False,

        fever=False,

        hearing_loss=False,

        ear_discharge=False,

        itching=False,

        recent_cold=False,

        duration_days=0

    ):

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        image_features = (
            self.extract_image_features(
                image
            )
        )

        # ----------------------------------------------------
        # CLINICAL
        # ----------------------------------------------------

        clinical_features = (
            self.extract_clinical_features(

                age=age,

                ear_pain=ear_pain,

                fever=fever,

                hearing_loss=hearing_loss,

                ear_discharge=ear_discharge,

                itching=itching,

                recent_cold=recent_cold,

                duration_days=duration_days
            )
        )

        # ----------------------------------------------------
        # Convert to tensors
        # ----------------------------------------------------

        image_tensor = torch.tensor(
            image_features,
            dtype=torch.float32,
            device=self.device
        ).unsqueeze(0)

        clinical_tensor = torch.tensor(
            clinical_features,
            dtype=torch.float32,
            device=self.device
        ).unsqueeze(0)

        # ----------------------------------------------------
        # MULTIMODAL PREDICTION
        # ----------------------------------------------------

        with torch.no_grad():

            # ------------------------------------------------
            # Feature Fusion
            # ------------------------------------------------

            combined = torch.cat(
                [
                    image_tensor,
                    clinical_tensor
                ],
                dim=1
            )

            fused = self.model.fusion(
                combined
            )

            # ------------------------------------------------
            # Attention
            # ------------------------------------------------

            attention_weights = (
                self.model.attention(
                    fused
                )
            )

            attended = (
                fused * attention_weights
            )

            # ------------------------------------------------
            # Disease
            # ------------------------------------------------

            disease_logits = (
                self.model.disease_head(
                    attended
                )
            )

            disease_probabilities = (
                torch.softmax(
                    disease_logits,
                    dim=1
                )
            )

            disease_index = int(
                torch.argmax(
                    disease_probabilities,
                    dim=1
                ).item()
            )

            # ------------------------------------------------
            # Severity
            # ------------------------------------------------

            severity_logits = (
                self.model.severity_head(
                    attended
                )
            )

            severity_probabilities = (
                torch.softmax(
                    severity_logits,
                    dim=1
                )
            )

            severity_index = int(
                torch.argmax(
                    severity_probabilities,
                    dim=1
                ).item()
            )

        # ----------------------------------------------------
        # Convert probabilities
        # ----------------------------------------------------

        disease_probs = (
            disease_probabilities
            .squeeze(0)
            .cpu()
            .numpy()
        )

        severity_probs = (
            severity_probabilities
            .squeeze(0)
            .cpu()
            .numpy()
        )

        # ----------------------------------------------------
        # Names
        # ----------------------------------------------------

        disease_name = (
            self.disease_classes[
                disease_index
            ]
        )

        severity_name = (
            self.severity_classes[
                severity_index
            ]
        )

        # ----------------------------------------------------
        # Confidence
        # ----------------------------------------------------

        disease_confidence = float(
            disease_probs[
                disease_index
            ]
        )

        severity_confidence = float(
            severity_probs[
                severity_index
            ]
        )

        # ----------------------------------------------------
        # Result
        # ----------------------------------------------------

        result = {

            "disease": disease_name,

            "disease_class": disease_index,

            "disease_confidence":
                disease_confidence,

            "disease_confidence_percent":
                round(
                    disease_confidence * 100,
                    2
                ),

            "severity": severity_name,

            "severity_class":
                severity_index,

            "severity_confidence":
                severity_confidence,

            "severity_confidence_percent":
                round(
                    severity_confidence * 100,
                    2
                ),

            "disease_probabilities": {

                self.disease_classes[i]:
                    float(disease_probs[i])

                for i in range(
                    len(self.disease_classes)
                )
            },

            "severity_probabilities": {

                self.severity_classes[i]:
                    float(severity_probs[i])

                for i in range(
                    len(self.severity_classes)
                )
            },

            "image_features":
                image_features,

            "clinical_features":
                clinical_features,

            "fused_features":
                fused
                .squeeze(0)
                .cpu()
                .numpy(),

            "attention_features":
                attended
                .squeeze(0)
                .cpu()
                .numpy()
        }

        return result


# ============================================================
# SIMPLE TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("TESTING OTITISAI-CDSS INFERENCE")
    print("=" * 60)

    # --------------------------------------------------------
    # Test image
    # --------------------------------------------------------

    test_image = os.path.join(

        PROJECT_ROOT,

        "data",

        "Otoscopic_Data",

        "Normal",

        "norm (99).jpg"
    )

    print()
    print("Test image:")
    print(test_image)

    if not os.path.exists(test_image):

        print()
        print("ERROR: Test image does not exist.")
        print()
        print(
            "Please change test_image to "
            "an existing image."
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Create engine
    # --------------------------------------------------------

    engine = OtitisInferenceEngine()

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    result = engine.predict(

        image=test_image,

        age=25,

        ear_pain=False,

        fever=False,

        hearing_loss=False,

        ear_discharge=False,

        itching=False,

        recent_cold=False,

        duration_days=0
    )

    # --------------------------------------------------------
    # Display result
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("PREDICTION RESULT")
    print("=" * 60)

    print(
        "Disease:",
        result["disease"]
    )

    print(
        "Disease Confidence:",
        str(
            result[
                "disease_confidence_percent"
            ]
        ) + "%"
    )

    print(
        "Severity:",
        result["severity"]
    )

    print(
        "Severity Confidence:",
        str(
            result[
                "severity_confidence_percent"
            ]
        ) + "%"
    )

    print()
    print("Disease probabilities:")

    for name, probability in (
        result[
            "disease_probabilities"
        ].items()
    ):

        print(
            f"  {name}: "
            f"{probability * 100:.2f}%"
        )

    print()
    print("Severity probabilities:")

    for name, probability in (
        result[
            "severity_probabilities"
        ].items()
    ):

        print(
            f"  {name}: "
            f"{probability * 100:.2f}%"
        )

    print()
    print("=" * 60)
    print("INFERENCE TEST COMPLETED")
    print("=" * 60)