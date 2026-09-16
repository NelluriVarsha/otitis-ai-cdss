import os
import numpy as np
import pandas as pd
import joblib

from PIL import Image

from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input

from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_DIR = os.path.dirname(BASE_DIR)

DATA_FILE = os.path.join(
    PROJECT_DIR,
    "data",
    "clinical_metadata.csv"
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
# SETTINGS
# ============================================================

IMAGE_SIZE = (128, 128)
BATCH_SIZE = 32

# Five classes used by the current predictor
CLASS_NAMES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]


# ============================================================
# LOAD DATASET
# ============================================================

print("=" * 60)
print("OtitisAI-CDSS KNN Training")
print("=" * 60)

print("\nLoading clinical metadata...")

df = pd.read_csv(DATA_FILE)

print("Dataset rows:", len(df))
print("Dataset columns:", len(df.columns))

required_columns = [
    "image_path",
    "label"
]

for column in required_columns:
    if column not in df.columns:
        raise RuntimeError(
            f"Required column missing: {column}"
        )


# ============================================================
# CHECK LABELS
# ============================================================

print("\nLabel distribution:")

print(
    df["label"]
    .value_counts()
    .sort_index()
)


unique_labels = sorted(
    df["label"].dropna().unique().tolist()
)

print("\nUnique labels:", unique_labels)

if not all(
    isinstance(x, (int, np.integer))
    for x in unique_labels
):
    raise RuntimeError(
        "Labels must be integer values."
    )

if any(
    x < 0 or x >= len(CLASS_NAMES)
    for x in unique_labels
):
    raise RuntimeError(
        "Dataset contains labels outside the "
        "supported class range 0-4."
    )


# ============================================================
# LOAD DENSENET121
# ============================================================

print("\nLoading DenseNet121...")

feature_extractor = DenseNet121(
    weights="imagenet",
    include_top=False,
    pooling="avg"
)

print("DenseNet121 loaded successfully.")

print(
    "Expected feature size:",
    feature_extractor.output_shape[-1]
)


# ============================================================
# FEATURE EXTRACTION
# ============================================================

features = []
labels = []

failed_images = []


print("\nExtracting image features...")
print("This may take some time on CPU.")


total = len(df)

for start in range(
    0,
    total,
    BATCH_SIZE
):

    batch_df = df.iloc[
        start:start + BATCH_SIZE
    ]

    batch_images = []
    batch_labels = []
    batch_indices = []

    for index, row in batch_df.iterrows():

        image_path = str(
            row["image_path"]
        )

        label = int(
            row["label"]
        )

        try:

            if not os.path.exists(
                image_path
            ):
                raise FileNotFoundError(
                    image_path
                )

            image = Image.open(
                image_path
            ).convert("RGB")

            image = image.resize(
                IMAGE_SIZE
            )

            image_array = np.array(
                image,
                dtype=np.float32
            )

            batch_images.append(
                image_array
            )

            batch_labels.append(
                label
            )

            batch_indices.append(
                index
            )

        except Exception as e:

            failed_images.append(
                {
                    "index": index,
                    "path": image_path,
                    "error": str(e)
                }
            )

    if batch_images:

        batch_array = np.array(
            batch_images,
            dtype=np.float32
        )

        batch_array = preprocess_input(
            batch_array
        )

        batch_features = (
            feature_extractor.predict(
                batch_array,
                verbose=0
            )
        )

        features.extend(
            batch_features
        )

        labels.extend(
            batch_labels
        )

    processed = min(
        start + BATCH_SIZE,
        total
    )

    print(
        f"Processed {processed}/{total}"
    )


# ============================================================
# CONVERT TO NUMPY
# ============================================================

X = np.asarray(
    features,
    dtype=np.float32
)

y = np.asarray(
    labels,
    dtype=np.int64
)


print("\nFeature extraction complete.")

print(
    "Feature matrix shape:",
    X.shape
)

print(
    "Label vector shape:",
    y.shape
)

print(
    "Failed images:",
    len(failed_images)
)


# ============================================================
# VALIDATE FEATURES
# ============================================================

if len(X) == 0:
    raise RuntimeError(
        "No image features were extracted."
    )

if X.shape[1] != 1024:
    raise RuntimeError(
        f"Expected 1024 DenseNet features, "
        f"got {X.shape[1]}"
    )


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("\nCreating train/test split...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print(
    "Training samples:",
    len(X_train)
)

print(
    "Testing samples:",
    len(X_test)
)


# ============================================================
# TRAIN KNN
# ============================================================

print("\nTraining KNN classifier...")

knn = KNeighborsClassifier(
    n_neighbors=5,
    weights="distance",
    metric="euclidean",
    n_jobs=-1
)

knn.fit(
    X_train,
    y_train
)

print(
    "KNN training completed."
)


# ============================================================
# EVALUATE
# ============================================================

print("\nEvaluating KNN...")

predictions = knn.predict(
    X_test
)

accuracy = accuracy_score(
    y_test,
    predictions
)

print(
    f"\nValidation accuracy: "
    f"{accuracy * 100:.2f}%"
)

print("\nClassification report:")

print(
    classification_report(
        y_test,
        predictions,
        labels=sorted(np.unique(y)),
        target_names=[
            CLASS_NAMES[i]
            for i in sorted(np.unique(y))
        ],
        zero_division=0
    )
)


# ============================================================
# RETRAIN ON FULL DATASET
# ============================================================

print("\nRetraining KNN using all available data...")

final_knn = KNeighborsClassifier(
    n_neighbors=5,
    weights="distance",
    metric="euclidean",
    n_jobs=-1
)

final_knn.fit(
    X,
    y
)

print(
    "Final KNN training completed."
)


# ============================================================
# SAVE MODEL
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

joblib.dump(
    final_knn,
    KNN_MODEL_PATH
)

print("\nKNN model saved successfully.")

print(
    "Model path:",
    KNN_MODEL_PATH
)

print(
    "Model size:",
    os.path.getsize(
        KNN_MODEL_PATH
    ),
    "bytes"
)

print(
    "Number of features:",
    final_knn.n_features_in_
)

print(
    "Model classes:",
    final_knn.classes_
)


# ============================================================
# SAVE FEATURE DATA
# ============================================================

feature_file = os.path.join(
    MODEL_DIR,
    "densenet_features.npz"
)

np.savez_compressed(
    feature_file,
    X=X,
    y=y
)

print(
    "\nFeature data saved:",
    feature_file
)


# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 60)
print("TRAINING FINISHED SUCCESSFULLY")
print("=" * 60)