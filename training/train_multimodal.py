# ============================================================
# OtitisAI-CDSS
# COMPLETE MULTIMODAL TRAINING PIPELINE
#
# Image:
#   Vision Transformer (ViT)
#
# Clinical:
#   Clinical Encoder
#
# Fusion:
#   Image Features + Clinical Features
#
# Attention:
#   Learnable Attention
#
# Prediction:
#   Disease + Severity
#
# ============================================================

import os
import sys
import random
import json

import numpy as np
import pandas as pd

from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim

from torch.utils.data import Dataset, DataLoader

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

import torchvision.transforms as transforms
from torchvision.models import vit_b_16, ViT_B_16_Weights


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

BACKEND_DIR = os.path.join(
    PROJECT_ROOT,
    "backend"
)

MODEL_DIR = os.path.join(
    BACKEND_DIR,
    "model"
)

DATA_DIR = os.path.join(
    PROJECT_ROOT,
    "data"
)

IMAGE_DIR = os.path.join(
    DATA_DIR,
    "Otoscopic_Data"
)

CLINICAL_CSV = os.path.join(
    DATA_DIR,
    "clinical_metadata.csv"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "trained_models"
)

CACHE_DIR = os.path.join(
    PROJECT_ROOT,
    "training_cache"
)


os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

os.makedirs(
    CACHE_DIR,
    exist_ok=True
)


# ============================================================
# ADD BACKEND TO PYTHON PATH
# ============================================================

if BACKEND_DIR not in sys.path:

    sys.path.insert(
        0,
        BACKEND_DIR
    )


# ============================================================
# IMPORT YOUR PROJECT COMPONENTS
# ============================================================

from model.clinical_encoder import ClinicalEncoder
from model.attention_module import AttentionModule


# ============================================================
# RANDOM SEED
# ============================================================

SEED = 42

random.seed(SEED)

np.random.seed(SEED)

torch.manual_seed(SEED)


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

print()
print("=" * 70)
print("OtitisAI-CDSS MULTIMODAL TRAINING")
print("=" * 70)

print()

print("Project root:")
print(PROJECT_ROOT)

print()

print("Device:")
print(DEVICE)

print()


# ============================================================
# DISEASE CLASSES
# ============================================================

CLASS_NAMES = [

    "Acute Otitis Media",

    "Cerumen Impaction",

    "Chronic Otitis Media",

    "Myringosclerosis",

    "Normal"
]


CLASS_TO_ID = {

    name: index

    for index, name
    in enumerate(CLASS_NAMES)

}


NUM_CLASSES = len(
    CLASS_NAMES
)


# ============================================================
# CLINICAL FEATURES
# ============================================================

CLINICAL_COLUMNS = [

    "age",

    "ear_pain",

    "fever",

    "hearing_loss",

    "ear_discharge",

    "itching",

    "recent_cold",

    "duration_days"

]


CLINICAL_INPUT_SIZE = 8

CLINICAL_FEATURE_SIZE = 128

IMAGE_FEATURE_SIZE = 768

FUSED_FEATURE_SIZE = (
    IMAGE_FEATURE_SIZE
    +
    CLINICAL_FEATURE_SIZE
)


# ============================================================
# UTILITY
# ============================================================

def print_section(title):

    print()
    print("=" * 70)
    print(title)
    print("=" * 70)
    print()


# ============================================================
# STEP 1
# COLLECT IMAGE DATA
# ============================================================

def collect_images():

    print_section(
        "STEP 1: COLLECTING IMAGE DATA"
    )

    samples = []

    for class_name in CLASS_NAMES:

        class_dir = os.path.join(
            IMAGE_DIR,
            class_name
        )

        if not os.path.exists(
            class_dir
        ):

            print(
                "WARNING: Missing folder:",
                class_dir
            )

            continue


        files = os.listdir(
            class_dir
        )

        image_files = [

            f

            for f in files

            if f.lower().endswith(
                (
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                )
            )

        ]


        print(
            f"{class_name}: "
            f"{len(image_files)} images"
        )


        for filename in image_files:

            image_path = os.path.join(
                class_dir,
                filename
            )

            samples.append({

                "image_path":
                    image_path,

                "label":
                    CLASS_TO_ID[
                        class_name
                    ],

                "class_name":
                    class_name

            })


    print()

    print(
        "TOTAL IMAGES:",
        len(samples)
    )

    return samples


# ============================================================
# STEP 2
# CREATE DEMO CLINICAL FEATURES
# ============================================================

def generate_demo_clinical_data(
    samples
):

    print_section(
        "STEP 2: PREPARING CLINICAL DATA"
    )

    print(
        "Clinical metadata file is empty or unavailable."
    )

    print(
        "Creating DEMONSTRATION clinical features."
    )

    print()

    print(
        "WARNING:"
    )

    print(
        "These are synthetic demonstration values."
    )

    print(
        "They are NOT real patient clinical data."
    )

    print()


    rows = []


    for sample in samples:

        class_id = sample[
            "label"
        ]


        # ----------------------------------------------------
        # Generate class-related DEMO symptoms
        # ----------------------------------------------------

        if class_id == 0:
            # Acute Otitis Media

            age = random.randint(
                5,
                60
            )

            ear_pain = 1

            fever = random.choice(
                [0, 1]
            )

            hearing_loss = random.choice(
                [0, 1]
            )

            ear_discharge = random.choice(
                [0, 1]
            )

            itching = 0

            recent_cold = random.choice(
                [0, 1]
            )

            duration_days = random.randint(
                1,
                10
            )


        elif class_id == 1:
            # Cerumen Impaction

            age = random.randint(
                10,
                70
            )

            ear_pain = random.choice(
                [0, 1]
            )

            fever = 0

            hearing_loss = 1

            ear_discharge = 0

            itching = random.choice(
                [0, 1]
            )

            recent_cold = 0

            duration_days = random.randint(
                5,
                30
            )


        elif class_id == 2:
            # Chronic Otitis Media

            age = random.randint(
                10,
                70
            )

            ear_pain = random.choice(
                [0, 1]
            )

            fever = 0

            hearing_loss = 1

            ear_discharge = 1

            itching = 0

            recent_cold = random.choice(
                [0, 1]
            )

            duration_days = random.randint(
                30,
                180
            )


        elif class_id == 3:
            # Myringosclerosis

            age = random.randint(
                15,
                75
            )

            ear_pain = 0

            fever = 0

            hearing_loss = random.choice(
                [0, 1]
            )

            ear_discharge = 0

            itching = 0

            recent_cold = 0

            duration_days = random.randint(
                30,
                365
            )


        else:
            # Normal

            age = random.randint(
                5,
                70
            )

            ear_pain = 0

            fever = 0

            hearing_loss = 0

            ear_discharge = 0

            itching = 0

            recent_cold = 0

            duration_days = 0


        rows.append({

            "image_path":
                sample[
                    "image_path"
                ],

            "age":
                age,

            "ear_pain":
                ear_pain,

            "fever":
                fever,

            "hearing_loss":
                hearing_loss,

            "ear_discharge":
                ear_discharge,

            "itching":
                itching,

            "recent_cold":
                recent_cold,

            "duration_days":
                duration_days,

            "label":
                class_id

        })


    df = pd.DataFrame(
        rows
    )


    df.to_csv(
        CLINICAL_CSV,
        index=False
    )


    print(
        "Demo clinical metadata created:"
    )

    print(
        CLINICAL_CSV
    )

    print()

    print(
        "Clinical records:",
        len(df)
    )


    return df


# ============================================================
# LOAD CLINICAL DATA
# ============================================================

def load_clinical_data(
    samples
):

    if not os.path.exists(
        CLINICAL_CSV
    ):

        return generate_demo_clinical_data(
            samples
        )


    try:

        df = pd.read_csv(
            CLINICAL_CSV
        )

    except Exception:

        return generate_demo_clinical_data(
            samples
        )


    if df.empty:

        return generate_demo_clinical_data(
            samples
        )


    required_columns = (

        ["image_path"]

        +
        CLINICAL_COLUMNS

        +
        ["label"]

    )


    missing = [

        c

        for c in required_columns

        if c not in df.columns

    ]


    if missing:

        print(
            "Clinical CSV is missing columns:"
        )

        print(
            missing
        )

        print()

        print(
            "Generating demonstration metadata."
        )

        return generate_demo_clinical_data(
            samples
        )


    return df


# ============================================================
# STEP 3
# VISION TRANSFORMER
# ============================================================

class ViTExtractor:

    def __init__(self):

        print_section(
            "STEP 3: LOADING VISION TRANSFORMER"
        )


        weights = (
            ViT_B_16_Weights.DEFAULT
        )


        self.model = vit_b_16(
            weights=weights
        )


        # Remove classification head

        self.model.heads = nn.Identity()


        self.model = (
            self.model
            .to(DEVICE)
        )


        self.model.eval()


        self.transform = (
            weights.transforms()
        )


        print(
            "Vision Transformer loaded."
        )

        print(
            "Feature size:",
            IMAGE_FEATURE_SIZE
        )


# ============================================================
# EXTRACT IMAGE FEATURE
# ============================================================

def extract_image_feature(
    extractor,
    image_path
):

    try:

        image = Image.open(
            image_path
        ).convert(
            "RGB"
        )


        tensor = extractor.transform(
            image
        )


        tensor = tensor.unsqueeze(
            0
        )


        tensor = tensor.to(
            DEVICE
        )


        with torch.no_grad():

            feature = (
                extractor.model(
                    tensor
                )
            )


        feature = (
            feature
            .cpu()
            .numpy()
            .astype(
                np.float32
            )
            .reshape(-1)
        )


        return feature


    except Exception as e:

        print(
            "Image processing error:"
        )

        print(
            image_path
        )

        print(
            e
        )

        return None


# ============================================================
# STEP 4
# EXTRACT ALL IMAGE FEATURES
# ============================================================

def extract_all_image_features(
    samples,
    extractor
):

    print_section(
        "STEP 4: EXTRACTING ViT FEATURES"
    )


    cache_file = os.path.join(
        CACHE_DIR,
        "vit_features.npy"
    )


    paths_cache = os.path.join(
        CACHE_DIR,
        "vit_paths.json"
    )


    # --------------------------------------------------------
    # LOAD CACHE IF AVAILABLE
    # --------------------------------------------------------

    if (

        os.path.exists(
            cache_file
        )

        and

        os.path.exists(
            paths_cache
        )

    ):

        print(
            "Existing ViT feature cache found."
        )

        try:

            features = np.load(
                cache_file
            )

            with open(
                paths_cache,
                "r"
            ) as f:

                cached_paths = json.load(
                    f
                )


            current_paths = [

                s[
                    "image_path"
                ]

                for s in samples

            ]


            if cached_paths == current_paths:

                print(
                    "Using cached ViT features."
                )

                return features


        except Exception:

            print(
                "Cache could not be loaded."
            )


    # --------------------------------------------------------
    # EXTRACT FEATURES
    # --------------------------------------------------------

    features = []

    valid_samples = []


    total = len(
        samples
    )


    for index, sample in enumerate(
        samples
    ):

        feature = extract_image_feature(
            extractor,
            sample[
                "image_path"
            ]
        )


        if feature is None:

            continue


        features.append(
            feature
        )

        valid_samples.append(
            sample
        )


        if (

            (index + 1) % 50 == 0

            or

            index == total - 1

        ):

            print(
                f"Processed "
                f"{index + 1}/{total}"
            )


    features = np.asarray(
        features,
        dtype=np.float32
    )


    # Save cache

    np.save(
        cache_file,
        features
    )


    with open(
        paths_cache,
        "w"
    ) as f:

        json.dump(

            [

                s[
                    "image_path"
                ]

                for s
                in valid_samples

            ],

            f

        )


    print()

    print(
        "ViT feature matrix:"
    )

    print(
        features.shape
    )


    return features, valid_samples


# ============================================================
# STEP 5
# MULTIMODAL MODEL
# ============================================================

class MultimodalModel(
    nn.Module
):

    def __init__(self):

        super().__init__()


        # ----------------------------------------------------
        # Clinical encoder
        # ----------------------------------------------------

        self.clinical_encoder = (
            ClinicalEncoder(
                input_size=8,
                hidden_size=32,
                output_size=128
            )
        )


        # ----------------------------------------------------
        # Fusion layer
        # ----------------------------------------------------

        self.fusion = nn.Sequential(

            nn.Linear(
                896,
                512
            ),

            nn.ReLU(),

            nn.Dropout(
                0.2
            )

        )


        # ----------------------------------------------------
        # Attention
        # ----------------------------------------------------

        self.attention = nn.Sequential(

            nn.Linear(
                512,
                256
            ),

            nn.Tanh(),

            nn.Linear(
                256,
                512
            ),

            nn.Sigmoid()

        )


        # ----------------------------------------------------
        # Disease head
        # ----------------------------------------------------

        self.disease_head = nn.Sequential(

            nn.Linear(
                512,
                256
            ),

            nn.ReLU(),

            nn.Dropout(
                0.2
            ),

            nn.Linear(
                256,
                NUM_CLASSES
            )

        )


        # ----------------------------------------------------
        # Severity head
        # ----------------------------------------------------

        self.severity_head = nn.Sequential(

            nn.Linear(
                512,
                128
            ),

            nn.ReLU(),

            nn.Linear(
                128,
                3
            )

        )


    # ========================================================
    # FORWARD
    # ========================================================

    def forward(
        self,
        image_features,
        clinical_features
    ):

        # Clinical encoding

        clinical_encoded = (
            self.clinical_encoder(
                clinical_features
            )
        )


        # Fusion

        fused = torch.cat(

            [
                image_features,
                clinical_encoded
            ],

            dim=1

        )


        fused = self.fusion(
            fused
        )


        # Attention

        attention_weights = (
            self.attention(
                fused
            )
        )


        attended = (
            fused
            *
            attention_weights
        )


        # Predictions

        disease_logits = (
            self.disease_head(
                attended
            )
        )


        severity_logits = (
            self.severity_head(
                attended
            )
        )


        return (

            disease_logits,

            severity_logits,

            attention_weights

        )


# ============================================================
# STEP 6
# PREPARE TRAINING DATA
# ============================================================

class MultimodalDataset(
    Dataset
):

    def __init__(
        self,
        image_features,
        clinical_features,
        labels,
        severity_labels
    ):

        self.image_features = (
            torch.tensor(
                image_features,
                dtype=torch.float32
            )
        )


        self.clinical_features = (
            torch.tensor(
                clinical_features,
                dtype=torch.float32
            )
        )


        self.labels = (
            torch.tensor(
                labels,
                dtype=torch.long
            )
        )


        self.severity_labels = (
            torch.tensor(
                severity_labels,
                dtype=torch.long
            )
        )


    def __len__(
        self
    ):

        return len(
            self.labels
        )


    def __getitem__(
        self,
        index
    ):

        return (

            self.image_features[
                index
            ],

            self.clinical_features[
                index
            ],

            self.labels[
                index
            ],

            self.severity_labels[
                index
            ]

        )


# ============================================================
# NORMALIZE CLINICAL FEATURES
# ============================================================

def prepare_clinical_features(
    df
):

    clinical = (
        df[
            CLINICAL_COLUMNS
        ]
        .copy()
    )


    clinical = (
        clinical
        .astype(
            np.float32
        )
    )


    # Normalize age

    clinical[
        "age"
    ] = (

        clinical[
            "age"
        ]

        / 100.0

    )


    # Normalize duration

    clinical[
        "duration_days"
    ] = (

        clinical[
            "duration_days"
        ]

        / 365.0

    )


    # Keep all values between 0 and 1

    clinical = (
        clinical
        .clip(
            0.0,
            1.0
        )
    )


    return clinical.values.astype(
        np.float32
    )


# ============================================================
# CREATE SEVERITY LABELS
# ============================================================

def create_severity_labels(
    df
):

    severity = []


    for _, row in df.iterrows():

        duration = float(
            row[
                "duration_days"
            ]
        )


        fever = int(
            row[
                "fever"
            ]
        )


        discharge = int(
            row[
                "ear_discharge"
            ]
        )


        hearing = int(
            row[
                "hearing_loss"
            ]
        )


        score = 0


        if fever:
            score += 1


        if discharge:
            score += 1


        if hearing:
            score += 1


        if duration > 30:
            score += 1


        if score <= 1:

            severity_label = 0

        elif score <= 2:

            severity_label = 1

        else:

            severity_label = 2


        severity.append(
            severity_label
        )


    return np.asarray(
        severity,
        dtype=np.int64
    )


# ============================================================
# STEP 7
# TRAIN MODEL
# ============================================================

def train_model(
    model,
    train_loader,
    val_loader,
    epochs=10
):

    print_section(
        "STEP 7: TRAINING MULTIMODAL MODEL"
    )


    criterion_disease = (
        nn.CrossEntropyLoss()
    )


    criterion_severity = (
        nn.CrossEntropyLoss()
    )


    optimizer = optim.Adam(

        model.parameters(),

        lr=0.001,

        weight_decay=1e-4

    )


    best_accuracy = 0.0


    for epoch in range(
        epochs
    ):

        model.train()


        total_loss = 0.0


        all_predictions = []

        all_labels = []


        for (

            image_features,

            clinical_features,

            labels,

            severity_labels

        ) in train_loader:


            image_features = (
                image_features
                .to(DEVICE)
            )


            clinical_features = (
                clinical_features
                .to(DEVICE)
            )


            labels = (
                labels
                .to(DEVICE)
            )


            severity_labels = (
                severity_labels
                .to(DEVICE)
            )


            optimizer.zero_grad()


            (

                disease_logits,

                severity_logits,

                attention_weights

            ) = model(

                image_features,

                clinical_features

            )


            disease_loss = (
                criterion_disease(
                    disease_logits,
                    labels
                )
            )


            severity_loss = (
                criterion_severity(
                    severity_logits,
                    severity_labels
                )
            )


            # Disease gets higher weight

            loss = (

                disease_loss

                +

                0.5
                *
                severity_loss

            )


            loss.backward()


            optimizer.step()


            total_loss += (
                loss.item()
            )


            predictions = (
                torch.argmax(
                    disease_logits,
                    dim=1
                )
            )


            all_predictions.extend(
                predictions
                .detach()
                .cpu()
                .numpy()
            )


            all_labels.extend(
                labels
                .detach()
                .cpu()
                .numpy()
            )


        train_accuracy = (
            accuracy_score(
                all_labels,
                all_predictions
            )
        )


        # ----------------------------------------------------
        # Validation
        # ----------------------------------------------------

        val_accuracy = evaluate_model(
            model,
            val_loader
        )


        average_loss = (
            total_loss
            /
            len(train_loader)
        )


        print(

            f"Epoch "
            f"{epoch + 1}/{epochs} | "

            f"Loss: "
            f"{average_loss:.4f} | "

            f"Train Accuracy: "
            f"{train_accuracy * 100:.2f}% | "

            f"Validation Accuracy: "
            f"{val_accuracy * 100:.2f}%"

        )


        # Save best model

        if val_accuracy > best_accuracy:

            best_accuracy = (
                val_accuracy
            )


            best_path = os.path.join(

                OUTPUT_DIR,

                "multimodal_best.pth"

            )


            torch.save(

                {

                    "model_state_dict":
                        model.state_dict(),

                    "class_names":
                        CLASS_NAMES,

                    "image_feature_size":
                        IMAGE_FEATURE_SIZE,

                    "clinical_feature_size":
                        CLINICAL_FEATURE_SIZE,

                    "fused_feature_size":
                        FUSED_FEATURE_SIZE,

                    "best_accuracy":
                        best_accuracy

                },

                best_path

            )


            print(
                "Best model saved."
            )


    return best_accuracy


# ============================================================
# EVALUATION
# ============================================================

def evaluate_model(
    model,
    loader
):

    model.eval()


    predictions = []

    labels_list = []


    with torch.no_grad():

        for (

            image_features,

            clinical_features,

            labels,

            severity_labels

        ) in loader:


            image_features = (
                image_features
                .to(DEVICE)
            )


            clinical_features = (
                clinical_features
                .to(DEVICE)
            )


            (

                disease_logits,

                _,

                _

            ) = model(

                image_features,

                clinical_features

            )


            predicted = (
                torch.argmax(
                    disease_logits,
                    dim=1
                )
            )


            predictions.extend(
                predicted
                .cpu()
                .numpy()
            )


            labels_list.extend(
                labels.numpy()
            )


    return accuracy_score(
        labels_list,
        predictions
    )


# ============================================================
# FINAL REPORT
# ============================================================

def final_evaluation(
    model,
    loader
):

    print_section(
        "FINAL MODEL EVALUATION"
    )


    model.eval()


    predictions = []

    true_labels = []


    with torch.no_grad():

        for (

            image_features,

            clinical_features,

            labels,

            severity_labels

        ) in loader:


            image_features = (
                image_features
                .to(DEVICE)
            )


            clinical_features = (
                clinical_features
                .to(DEVICE)
            )


            (

                disease_logits,

                severity_logits,

                attention_weights

            ) = model(

                image_features,

                clinical_features

            )


            predicted = (
                torch.argmax(
                    disease_logits,
                    dim=1
                )
            )


            predictions.extend(
                predicted
                .cpu()
                .numpy()
            )


            true_labels.extend(
                labels.numpy()
            )


    print(
        classification_report(

            true_labels,

            predictions,

            target_names=
                CLASS_NAMES,

            zero_division=0

        )
    )


# ============================================================
# MAIN
# ============================================================

def main():

    # --------------------------------------------------------
    # Collect images
    # --------------------------------------------------------

    samples = collect_images()


    if len(samples) == 0:

        raise RuntimeError(

            "No images found. "
            "Check data/Otoscopic_Data."

        )


    # --------------------------------------------------------
    # Clinical metadata
    # --------------------------------------------------------

    clinical_df = (
        load_clinical_data(
            samples
        )
    )


    # --------------------------------------------------------
    # Match image paths
    # --------------------------------------------------------

    sample_df = pd.DataFrame(
        samples
    )


    # Normalize paths

    sample_df[
        "image_path"
    ] = (

        sample_df[
            "image_path"
        ]
        .apply(
            os.path.abspath
        )

    )


    clinical_df[
        "image_path"
    ] = (

        clinical_df[
            "image_path"
        ]
        .apply(
            os.path.abspath
        )

    )


    # --------------------------------------------------------
    # Merge image + clinical information
    # --------------------------------------------------------

    df = pd.merge(

        sample_df,

        clinical_df,

        on="image_path",

        how="inner",

        suffixes=(
            "_image",
            "_clinical"
        )

    )


    # --------------------------------------------------------
    # Use image label as disease label
    # --------------------------------------------------------

    df[
        "label"
    ] = df[
        "label_image"
    ]


    print_section(
        "DATASET SUMMARY"
    )


    print(
        "Total multimodal samples:",
        len(df)
    )


    print()

    print(
        df[
            "class_name"
        ]
        .value_counts()
    )


    # --------------------------------------------------------
    # Extract ViT features
    # --------------------------------------------------------

    extractor = (
        ViTExtractor()
    )


    result = (
        extract_all_image_features(
            samples,
            extractor
        )
    )


    if isinstance(
        result,
        tuple
    ):

        image_features, valid_samples = (
            result
        )

    else:

        image_features = result

        valid_samples = samples


    # --------------------------------------------------------
    # Rebuild dataframe based on valid images
    # --------------------------------------------------------

    valid_paths = [

        os.path.abspath(
            s[
                "image_path"
            ]
        )

        for s
        in valid_samples

    ]


    df = df[
        df[
            "image_path"
        ].isin(
            valid_paths
        )
    ].copy()


    df = df.set_index(
        "image_path"
    )


    df = df.loc[
        valid_paths
    ].reset_index()


    # --------------------------------------------------------
    # Clinical features
    # --------------------------------------------------------

    clinical_features = (
        prepare_clinical_features(
            df
        )
    )


    # --------------------------------------------------------
    # Disease labels
    # --------------------------------------------------------

    labels = (
        df[
            "label"
        ]
        .values
        .astype(
            np.int64
        )
    )


    # --------------------------------------------------------
    # Severity labels
    # --------------------------------------------------------

    severity_labels = (
        create_severity_labels(
            df
        )
    )


    # --------------------------------------------------------
    # Verify dimensions
    # --------------------------------------------------------

    print_section(
        "FEATURE DIMENSIONS"
    )


    print(
        "Image features:",
        image_features.shape
    )


    print(
        "Clinical features:",
        clinical_features.shape
    )


    print(
        "Disease labels:",
        labels.shape
    )


    print(
        "Severity labels:",
        severity_labels.shape
    )


    # --------------------------------------------------------
    # Train/validation split
    # --------------------------------------------------------

    (

        X_train_img,

        X_val_img,

        X_train_clin,

        X_val_clin,

        y_train,

        y_val,

        sev_train,

        sev_val

    ) = train_test_split(

        image_features,

        clinical_features,

        labels,

        severity_labels,

        test_size=0.20,

        random_state=SEED,

        stratify=labels

    )


    print_section(
        "TRAIN / VALIDATION SPLIT"
    )


    print(
        "Training samples:",
        len(X_train_img)
    )


    print(
        "Validation samples:",
        len(X_val_img)
    )


    # --------------------------------------------------------
    # Datasets
    # --------------------------------------------------------

    train_dataset = (
        MultimodalDataset(

            X_train_img,

            X_train_clin,

            y_train,

            sev_train

        )
    )


    val_dataset = (
        MultimodalDataset(

            X_val_img,

            X_val_clin,

            y_val,

            sev_val

        )
    )


    # --------------------------------------------------------
    # Data loaders
    # --------------------------------------------------------

    train_loader = DataLoader(

        train_dataset,

        batch_size=32,

        shuffle=True

    )


    val_loader = DataLoader(

        val_dataset,

        batch_size=32,

        shuffle=False

    )


    # --------------------------------------------------------
    # Create model
    # --------------------------------------------------------

    model = (
        MultimodalModel()
        .to(DEVICE)
    )


    print_section(
        "MULTIMODAL MODEL"
    )


    print(
        model
    )


    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    best_accuracy = train_model(

        model,

        train_loader,

        val_loader,

        epochs=10

    )


    # --------------------------------------------------------
    # Load best model
    # --------------------------------------------------------

    best_path = os.path.join(

        OUTPUT_DIR,

        "multimodal_best.pth"

    )


    if os.path.exists(
        best_path
    ):

        checkpoint = torch.load(

            best_path,

            map_location=DEVICE

        )


        model.load_state_dict(

            checkpoint[
                "model_state_dict"
            ]

        )


    # --------------------------------------------------------
    # Final evaluation
    # --------------------------------------------------------

    final_evaluation(

        model,

        val_loader

    )


    # --------------------------------------------------------
    # Save final model
    # --------------------------------------------------------

    final_path = os.path.join(

        OUTPUT_DIR,

        "otitis_multimodal_model.pth"

    )


    torch.save(

        {

            "model_state_dict":
                model.state_dict(),

            "class_names":
                CLASS_NAMES,

            "num_classes":
                NUM_CLASSES,

            "image_feature_size":
                IMAGE_FEATURE_SIZE,

            "clinical_input_size":
                CLINICAL_INPUT_SIZE,

            "clinical_feature_size":
                CLINICAL_FEATURE_SIZE,

            "fused_feature_size":
                FUSED_FEATURE_SIZE,

            "best_validation_accuracy":
                best_accuracy

        },

        final_path

    )


    # --------------------------------------------------------
    # Save configuration
    # --------------------------------------------------------

    config_path = os.path.join(

        OUTPUT_DIR,

        "model_config.json"

    )


    config = {

        "classes":
            CLASS_NAMES,

        "num_classes":
            NUM_CLASSES,

        "image_feature_size":
            IMAGE_FEATURE_SIZE,

        "clinical_input_size":
            CLINICAL_INPUT_SIZE,

        "clinical_feature_size":
            CLINICAL_FEATURE_SIZE,

        "fused_feature_size":
            FUSED_FEATURE_SIZE,

        "severity_classes":
            3,

        "device":
            str(DEVICE)

    }


    with open(
        config_path,
        "w"
    ) as f:

        json.dump(
            config,
            f,
            indent=4
        )


    print_section(
        "TRAINING COMPLETED"
    )


    print(
        "Best validation accuracy:"
    )

    print(
        f"{best_accuracy * 100:.2f}%"
    )

    print()

    print(
        "Final model:"
    )

    print(
        final_path
    )

    print()

    print(
        "Best model:"
    )

    print(
        best_path
    )

    print()

    print(
        "Configuration:"
    )

    print(
        config_path
    )

    print()

    print(
        "Clinical metadata:"
    )

    print(
        CLINICAL_CSV
    )

    print()

    print(
        "=" * 70
    )

    print(
        "NEXT STEP: CONNECT THE TRAINED MODEL TO FastAPI"
    )

    print(
        "=" * 70
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()