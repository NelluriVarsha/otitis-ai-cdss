# ============================================================
# OtitisAI-CDSS
# Clinical Encoder
# ============================================================

import torch
import torch.nn as nn


class ClinicalEncoder(nn.Module):

    def __init__(self, input_size=8, hidden_size=32, output_size=128):

        super().__init__()

        print("Loading Clinical Encoder...")

        self.network = nn.Sequential(

            nn.Linear(input_size, hidden_size),

            nn.ReLU(),

            nn.Dropout(0.2),

            nn.Linear(hidden_size, hidden_size),

            nn.ReLU(),

            nn.Linear(hidden_size, output_size)

        )

        print("Clinical Encoder created successfully.")

    # ========================================================
    # FORWARD
    # ========================================================

    def forward(self, clinical_data):

        return self.network(clinical_data)


# ============================================================
# PREPROCESS CLINICAL DATA
# ============================================================

def prepare_clinical_features(
    age=0,
    ear_pain=False,
    fever=False,
    hearing_loss=False,
    ear_discharge=False,
    itching=False,
    recent_cold=False,
    duration_days=0
):

    features = [

        float(age),

        float(ear_pain),

        float(fever),

        float(hearing_loss),

        float(ear_discharge),

        float(itching),

        float(recent_cold),

        float(duration_days)

    ]

    return torch.tensor(
        features,
        dtype=torch.float32
    )


# ============================================================
# TEST CLINICAL ENCODER
# ============================================================

if __name__ == "__main__":

    encoder = ClinicalEncoder()

    clinical_features = prepare_clinical_features(

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
    print("Input clinical features:")
    print(clinical_features)

    clinical_features = clinical_features.unsqueeze(0)

    with torch.no_grad():

        encoded_features = encoder(
            clinical_features
        )

    print()
    print("Encoded clinical feature shape:")
    print(encoded_features.shape)

    print()
    print("Encoded clinical feature:")
    print(encoded_features)