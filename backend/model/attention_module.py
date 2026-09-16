# ============================================================
# OtitisAI-CDSS
# Multimodal Attention Module
# Image + Clinical Feature Attention
# ============================================================

import numpy as np


class AttentionModule:

    def __init__(self, feature_dimension=784):

        print("Initializing Attention Module...")

        self.feature_dimension = feature_dimension

        print(
            f"Expected fused feature dimension: "
            f"{self.feature_dimension}"
        )

        print(
            "Attention Module initialized successfully."
        )

    # ========================================================
    # APPLY ATTENTION
    # ========================================================

    def apply_attention(self, fused_features):

        # ----------------------------------------------------
        # Convert to NumPy
        # ----------------------------------------------------

        fused_features = np.asarray(
            fused_features,
            dtype=np.float32
        )

        # ----------------------------------------------------
        # Flatten
        # ----------------------------------------------------

        fused_features = fused_features.flatten()

        # ----------------------------------------------------
        # Validate dimensions
        # ----------------------------------------------------

        if fused_features.shape[0] != self.feature_dimension:

            raise ValueError(
                f"Expected "
                f"{self.feature_dimension} "
                f"features, but received "
                f"{fused_features.shape[0]}"
            )

        # ----------------------------------------------------
        # Validate numerical values
        # ----------------------------------------------------

        if not np.isfinite(
            fused_features
        ).all():

            raise ValueError(
                "Fused features contain "
                "NaN or infinite values."
            )

        # ----------------------------------------------------
        # Calculate feature importance
        # ----------------------------------------------------

        absolute_features = np.abs(
            fused_features
        )

        total = np.sum(
            absolute_features
        )

        # ----------------------------------------------------
        # Avoid division by zero
        # ----------------------------------------------------

        if total == 0:

            attention_weights = np.ones(
                self.feature_dimension,
                dtype=np.float32
            ) / self.feature_dimension

        else:

            attention_weights = (
                absolute_features / total
            )

        # ----------------------------------------------------
        # Apply attention
        # ----------------------------------------------------

        attended_features = (
            fused_features *
            attention_weights
        )

        # ----------------------------------------------------
        # Safety check
        # ----------------------------------------------------

        if not np.isfinite(
            attended_features
        ).all():

            raise ValueError(
                "Attention output contains "
                "NaN or infinite values."
            )

        return attended_features

    # ========================================================
    # GET ATTENTION WEIGHTS
    # ========================================================

    def get_attention_weights(
        self,
        fused_features
    ):

        fused_features = np.asarray(
            fused_features,
            dtype=np.float32
        ).flatten()

        if fused_features.shape[0] != self.feature_dimension:

            raise ValueError(
                f"Expected "
                f"{self.feature_dimension} "
                f"features, but received "
                f"{fused_features.shape[0]}"
            )

        absolute_features = np.abs(
            fused_features
        )

        total = np.sum(
            absolute_features
        )

        if total == 0:

            return np.ones(
                self.feature_dimension,
                dtype=np.float32
            ) / self.feature_dimension

        return (
            absolute_features / total
        )