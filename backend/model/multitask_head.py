# ============================================================
# OtitisAI-CDSS
# Multi-Task Prediction Head
#
# Input:
#   Attention-weighted multimodal features
#
# Outputs:
#   1. Disease classification
#   2. Severity classification
#   3. Disease probabilities
#   4. Severity probabilities
# ============================================================

import torch
import torch.nn as nn
import torch.nn.functional as F


class MultiTaskPredictionHead(nn.Module):

    def __init__(
        self,
        input_size=896,
        hidden_size=256,
        num_diseases=5,
        num_severity=3
    ):

        super().__init__()

        print("Initializing Multi-Task Prediction Head...")

        self.input_size = input_size
        self.num_diseases = num_diseases
        self.num_severity = num_severity

        # ----------------------------------------------------
        # Shared multimodal representation
        # ----------------------------------------------------

        self.shared = nn.Sequential(

            nn.Linear(
                input_size,
                hidden_size
            ),

            nn.ReLU(),

            nn.Dropout(0.2),

            nn.Linear(
                hidden_size,
                hidden_size
            ),

            nn.ReLU()

        )

        # ----------------------------------------------------
        # Disease prediction branch
        # ----------------------------------------------------

        self.disease_head = nn.Linear(
            hidden_size,
            num_diseases
        )

        # ----------------------------------------------------
        # Severity prediction branch
        # ----------------------------------------------------

        self.severity_head = nn.Linear(
            hidden_size,
            num_severity
        )

        print(
            "Multi-Task Prediction Head initialized successfully."
        )

    # ========================================================
    # FORWARD
    # ========================================================

    def forward(
        self,
        features
    ):

        # ----------------------------------------------------
        # Make sure input has batch dimension
        # ----------------------------------------------------

        if features.dim() == 1:

            features = features.unsqueeze(0)

        # ----------------------------------------------------
        # Shared representation
        # ----------------------------------------------------

        shared_features = self.shared(
            features
        )

        # ----------------------------------------------------
        # Disease logits
        # ----------------------------------------------------

        disease_logits = self.disease_head(
            shared_features
        )

        # ----------------------------------------------------
        # Severity logits
        # ----------------------------------------------------

        severity_logits = self.severity_head(
            shared_features
        )

        return {
            "disease_logits": disease_logits,
            "severity_logits": severity_logits,
            "shared_features": shared_features
        }

    # ========================================================
    # PREDICTION
    # ========================================================

    def predict(
        self,
        features
    ):

        self.eval()

        with torch.no_grad():

            outputs = self.forward(
                features
            )

            disease_probabilities = F.softmax(
                outputs["disease_logits"],
                dim=1
            )

            severity_probabilities = F.softmax(
                outputs["severity_logits"],
                dim=1
            )

            disease_prediction = torch.argmax(
                disease_probabilities,
                dim=1
            )

            severity_prediction = torch.argmax(
                severity_probabilities,
                dim=1
            )

        return {

            "disease_prediction":
                disease_prediction,

            "disease_probabilities":
                disease_probabilities,

            "severity_prediction":
                severity_prediction,

            "severity_probabilities":
                severity_probabilities

        }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("Testing Multi-Task Prediction Head...")
    print()

    model = MultiTaskPredictionHead(
        input_size=896,
        hidden_size=256,
        num_diseases=5,
        num_severity=3
    )

    # Fake multimodal feature vector
    test_features = torch.randn(
        1,
        896
    )

    outputs = model.predict(
        test_features
    )

    print()
    print(
        "Disease prediction:",
        outputs["disease_prediction"]
    )

    print(
        "Disease probability shape:",
        outputs["disease_probabilities"].shape
    )

    print(
        "Severity prediction:",
        outputs["severity_prediction"]
    )

    print(
        "Severity probability shape:",
        outputs["severity_probabilities"].shape
    )

    print()
    print("Multi-Task Prediction Head test completed.")