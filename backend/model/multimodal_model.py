# ============================================================
# OtitisAI-CDSS
# Complete Multimodal Model
# ViT + Clinical Encoder + Feature Fusion
# + Attention + Multi-Task Prediction
# ============================================================

import numpy as np
import torch

from model.vit_model import ViTFeatureExtractor
from model.clinical_encoder import (
    ClinicalEncoder,
    prepare_clinical_features
)
from model.feature_fusion import FeatureFusion
from model.attention_module import AttentionModule
from model.multitask_head import MultiTaskPredictionHead


class MultimodalModel:

    def __init__(self):

        print()
        print("=" * 60)
        print("Initializing OtitisAI-CDSS Multimodal Model")
        print("=" * 60)

        # ----------------------------------------------------
        # 1. Vision Transformer
        # ----------------------------------------------------

        self.vit = ViTFeatureExtractor()

        # ----------------------------------------------------
        # 2. Clinical Encoder
        # ----------------------------------------------------

        self.clinical_encoder = ClinicalEncoder(
            input_size=8,
            hidden_size=32,
            output_size=128
        )

        self.clinical_encoder.eval()

        # ----------------------------------------------------
        # 3. Feature Fusion
        # ----------------------------------------------------

        self.fusion = FeatureFusion()

        # ViT = 768
        # Clinical encoder = 128
        # Total = 896

        self.fused_dimension = 768 + 128

        # ----------------------------------------------------
        # 4. Attention
        # ----------------------------------------------------

        self.attention = AttentionModule(
            self.fused_dimension
        )

        # ----------------------------------------------------
        # 5. Multi-task Prediction Head
        # ----------------------------------------------------

        self.prediction_head = MultiTaskPredictionHead(
            input_size=self.fused_dimension,
            num_diseases=5,
            num_severity_levels=3
        )

        print()
        print("Multimodal model initialized successfully.")

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

        print()
        print("-" * 60)
        print("Starting multimodal prediction...")
        print("-" * 60)

        # ----------------------------------------------------
        # STEP 1: IMAGE FEATURES
        # ----------------------------------------------------

        image_features = self.vit.extract_features(
            image
        )

        print(
            "ViT feature shape:",
            image_features.shape
        )

        # ----------------------------------------------------
        # STEP 2: CLINICAL FEATURES
        # ----------------------------------------------------

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

        # Add batch dimension

        clinical_input = clinical_input.unsqueeze(0)

        # ----------------------------------------------------
        # STEP 3: CLINICAL ENCODER
        # ----------------------------------------------------

        with torch.no_grad():

            clinical_features = self.clinical_encoder(
                clinical_input
            )

        clinical_features = clinical_features.squeeze(0)

        clinical_features = clinical_features.numpy()

        print(
            "Clinical feature shape:",
            clinical_features.shape
        )

        # ----------------------------------------------------
        # STEP 4: FEATURE FUSION
        # ----------------------------------------------------

        fused_features = self.fusion.fuse(

            image_features,

            clinical_features
        )

        print(
            "Fused feature shape:",
            fused_features.shape
        )

        # ----------------------------------------------------
        # STEP 5: ATTENTION
        # ----------------------------------------------------

        attended_features = self.attention.apply_attention(
            fused_features
        )

        print(
            "Attention feature shape:",
            attended_features.shape
        )

        # ----------------------------------------------------
        # STEP 6: CONVERT TO TORCH
        # ----------------------------------------------------

        attended_tensor = torch.tensor(
            attended_features,
            dtype=torch.float32
        ).unsqueeze(0)

        # ----------------------------------------------------
        # STEP 7: MULTI-TASK PREDICTION
        # ----------------------------------------------------

        with torch.no_grad():

            result = self.prediction_head(
                attended_tensor
            )

        # ----------------------------------------------------
        # RETURN RESULT
        # ----------------------------------------------------

        return {

            "disease_class":
                result["disease_class"].item(),

            "disease_probabilities":
                result["disease_probabilities"]
                .squeeze(0)
                .numpy(),

            "severity_class":
                result["severity_class"].item(),

            "severity_probabilities":
                result["severity_probabilities"]
                .squeeze(0)
                .numpy(),

            "image_features":
                image_features,

            "clinical_features":
                clinical_features,

            "fused_features":
                fused_features,

            "attention_features":
                attended_features
        }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("Testing complete multimodal model...")

    from PIL import Image

    image_path = (
        r"C:\Users\nellu\OneDrive\Documents"
        r"\IPD project1\otitis_ai_cdss"
        r"\data\Otoscopic_Data\Normal\norm (99).jpg"
    )

    image = Image.open(
        image_path
    ).convert("RGB")

    model = MultimodalModel()

    result = model.predict(

        image=image,

        age=25,

        ear_pain=True,

        fever=True,

        hearing_loss=True,

        ear_discharge=False,

        itching=False,

        recent_cold=True,

        duration_days=5
    )

    print()
    print("=" * 60)
    print("MULTIMODAL MODEL RESULT")
    print("=" * 60)

    print(
        "Disease class:",
        result["disease_class"]
    )

    print(
        "Disease probabilities:",
        result["disease_probabilities"]
    )

    print(
        "Severity class:",
        result["severity_class"]
    )

    print(
        "Severity probabilities:",
        result["severity_probabilities"]
    )

    print()
    print("Multimodal model test completed.")