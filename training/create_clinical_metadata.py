import os
import pandas as pd
import random

# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

IMAGE_ROOT = os.path.join(
    PROJECT_ROOT,
    "data",
    "Otoscopic_Data"
)

OUTPUT_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "clinical_metadata.csv"
)

# ============================================================
# CLASS INFORMATION
# ============================================================

CLASS_NAMES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]

# ============================================================
# REPRODUCIBILITY
# ============================================================

random.seed(42)

# ============================================================
# COLLECT IMAGES
# ============================================================

records = []

for class_name in CLASS_NAMES:

    class_directory = os.path.join(
        IMAGE_ROOT,
        class_name
    )

    if not os.path.isdir(class_directory):
        print(
            f"WARNING: Directory not found: {class_directory}"
        )
        continue

    image_files = [
        f for f in os.listdir(class_directory)
        if f.lower().endswith(
            (".jpg", ".jpeg", ".png", ".webp")
        )
    ]

    print(
        f"{class_name}: {len(image_files)} images"
    )

    for filename in image_files:

        image_path = os.path.join(
            class_directory,
            filename
        )

        # ----------------------------------------------------
        # Generate clinical features
        # ----------------------------------------------------

        if class_name == "Acute Otitis Media":

            age = random.randint(2, 40)
            ear_pain = 1
            fever = random.choice([0, 1])
            hearing_loss = random.choice([0, 1])
            ear_discharge = random.choice([0, 1])
            itching = 0
            recent_cold = random.choice([0, 1])
            duration_days = random.randint(1, 10)

        elif class_name == "Chronic Otitis Media":

            age = random.randint(10, 60)
            ear_pain = random.choice([0, 1])
            fever = 0
            hearing_loss = 1
            ear_discharge = random.choice([0, 1])
            itching = 0
            recent_cold = random.choice([0, 1])
            duration_days = random.randint(15, 180)

        elif class_name == "Cerumen Impaction":

            age = random.randint(5, 70)
            ear_pain = random.choice([0, 1])
            fever = 0
            hearing_loss = random.choice([0, 1])
            ear_discharge = 0
            itching = random.choice([0, 1])
            recent_cold = 0
            duration_days = random.randint(2, 30)

        elif class_name == "Myringosclerosis":

            age = random.randint(15, 70)
            ear_pain = 0
            fever = 0
            hearing_loss = random.choice([0, 1])
            ear_discharge = 0
            itching = 0
            recent_cold = 0
            duration_days = random.randint(30, 365)

        else:

            # Normal ear
            age = random.randint(5, 70)
            ear_pain = 0
            fever = 0
            hearing_loss = 0
            ear_discharge = 0
            itching = 0
            recent_cold = 0
            duration_days = 0

        # ----------------------------------------------------
        # Add record
        # ----------------------------------------------------

        records.append({

            "image_path": image_path,

            "class_name": class_name,

            "age": age,

            "ear_pain": ear_pain,

            "fever": fever,

            "hearing_loss": hearing_loss,

            "ear_discharge": ear_discharge,

            "itching": itching,

            "recent_cold": recent_cold,

            "duration_days": duration_days

        })


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame(records)

# ============================================================
# SHUFFLE
# ============================================================

df = df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

# ============================================================
# SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("=" * 60)
print("CLINICAL METADATA CREATED")
print("=" * 60)

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Total records: {len(df)}"
)

print()
print("Columns:")
print(
    list(df.columns)
)

print()
print("Class distribution:")
print(
    df["class_name"].value_counts()
)

print()
print("First 5 records:")
print(
    df.head().to_string()
)

print()
print("Metadata creation completed successfully.")