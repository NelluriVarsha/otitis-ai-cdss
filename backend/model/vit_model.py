# ============================================================
# OtitisAI-CDSS
# Vision Transformer Feature Extractor
# ============================================================

import torch
import torch.nn as nn

from torchvision.models import (
    vit_b_16,
    ViT_B_16_Weights
)


class ViTFeatureExtractor:

    def __init__(self):

        print("Loading Vision Transformer...")

        self.device = torch.device(
            "cuda" if torch.cuda.is_available()
            else "cpu"
        )

        print(
            f"ViT device: {self.device}"
        )

        # ----------------------------------------------------
        # Load pretrained ViT
        # ----------------------------------------------------

        weights = ViT_B_16_Weights.DEFAULT

        self.model = vit_b_16(
            weights=weights
        )

        # ----------------------------------------------------
        # Remove classification head
        # ----------------------------------------------------

        self.model.heads = nn.Identity()

        self.model = self.model.to(
            self.device
        )

        self.model.eval()

        # ----------------------------------------------------
        # Image preprocessing
        # ----------------------------------------------------

        self.transform = (
            weights.transforms()
        )

        print(
            "Vision Transformer loaded successfully."
        )


    # ========================================================
    # EXTRACT FEATURES
    # ========================================================

    def extract_features(
        self,
        image
    ):

        # ----------------------------------------------------
        # Apply preprocessing
        # ----------------------------------------------------

        image_tensor = self.transform(
            image
        )


        # ----------------------------------------------------
        # Add batch dimension
        # ----------------------------------------------------

        image_tensor = image_tensor.unsqueeze(
            0
        )


        image_tensor = image_tensor.to(
            self.device
        )


        # ----------------------------------------------------
        # Extract ViT features
        # ----------------------------------------------------

        with torch.no_grad():

            features = self.model(
                image_tensor
            )


        # ----------------------------------------------------
        # Convert to CPU
        # ----------------------------------------------------

        features = features.cpu()


        # ----------------------------------------------------
        # Flatten
        # ----------------------------------------------------

        features = features.numpy()


        return features[0]