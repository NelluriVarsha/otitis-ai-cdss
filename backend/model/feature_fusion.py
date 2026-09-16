# ============================================================
# OtitisAI-CDSS
# Multimodal Feature Fusion
# Image Features + Clinical Features
# ============================================================

import numpy as np


class FeatureFusion:

    def __init__(self):

        print("Initializing Feature Fusion...")

        self.image_dimension = 768

        print(
            f"Expected ViT features: {self.image_dimension}"
        )

        print(
            "Feature Fusion initialized successfully."
        )

    # ========================================================
    # FUSE IMAGE + CLINICAL FEATURES
    # ========================================================

    def fuse(
        self,
        image_features,
        clinical_features
    ):

        # ----------------------------------------------------
        # Convert to numpy arrays
        # ----------------------------------------------------

        image_features = np.asarray(
            image_features,
            dtype=np.float32
        )

        clinical_features = np.asarray(
            clinical_features,
            dtype=np.float32
        )

        # ----------------------------------------------------
        # Flatten
        # ----------------------------------------------------

        image_features = image_features.flatten()

        clinical_features = clinical_features.flatten()

        # ----------------------------------------------------
        # Validate image features
        # ----------------------------------------------------

        if image_features.shape[0] != self.image_dimension:

            raise ValueError(
                f"Expected {self.image_dimension} "
                f"image features, but received "
                f"{image_features.shape[0]}"
            )

        # ----------------------------------------------------
        # Concatenate
        # ----------------------------------------------------

        fused_features = np.concatenate(
            [
                image_features,
                clinical_features
            ]
        )

        # ----------------------------------------------------
        # Safety check
        # ----------------------------------------------------

        if not np.isfinite(
            fused_features
        ).all():

            raise ValueError(
                "Fused features contain "
                "NaN or infinite values."
            )

        return fused_features