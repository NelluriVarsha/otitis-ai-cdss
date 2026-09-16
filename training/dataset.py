# ============================================================
# OtitisAI-CDSS
# Multimodal Training Dataset
# ============================================================

from pathlib import Path
from PIL import Image


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATASET_DIR = (
    PROJECT_ROOT
    / "data"
    / "Otoscopic_Data"
)


# ============================================================
# CLASS DEFINITIONS
# ============================================================

CLASS_NAMES = [
    "Acute Otitis Media",
    "Cerumen Impaction",
    "Chronic Otitis Media",
    "Myringosclerosis",
    "Normal"
]

CLASS_TO_INDEX = {
    name: index
    for index, name in enumerate(CLASS_NAMES)
}


# ============================================================
# SUPPORTED IMAGE TYPES
# ============================================================

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}


# ============================================================
# COLLECT IMAGE SAMPLES
# ============================================================

def collect_image_samples():

    samples = []

    print()
    print("Dataset directory:")
    print(DATASET_DIR)

    if not DATASET_DIR.exists():

        raise FileNotFoundError(
            f"Dataset directory not found: {DATASET_DIR}"
        )

    # --------------------------------------------------------
    # Read each disease folder
    # --------------------------------------------------------

    for class_name in CLASS_NAMES:

        class_dir = DATASET_DIR / class_name

        if not class_dir.exists():

            print(
                f"WARNING: Missing class folder: {class_name}"
            )

            continue

        class_index = CLASS_TO_INDEX[class_name]

        # ----------------------------------------------------
        # Find images
        # ----------------------------------------------------

        image_files = [
            file
            for file in class_dir.iterdir()
            if file.is_file()
            and file.suffix.lower()
            in IMAGE_EXTENSIONS
        ]

        print(
            f"{class_name}: {len(image_files)} images"
        )

        # ----------------------------------------------------
        # Create sample records
        # ----------------------------------------------------

        for image_path in image_files:

            samples.append({

                "image_path":
                    str(image_path),

                "label":
                    class_index,

                "class_name":
                    class_name

            })

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print()
    print(
        f"TOTAL IMAGE SAMPLES: {len(samples)}"
    )

    return samples


# ============================================================
# CHECK IMAGE
# ============================================================

def validate_image(image_path):

    try:

        with Image.open(image_path) as image:

            image.verify()

        return True

    except Exception:

        return False


# ============================================================
# MAIN TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("==========================================")
    print("Testing OtitisAI Dataset Loader")
    print("==========================================")

    samples = collect_image_samples()

    print()

    valid_count = 0
    invalid_count = 0

    for sample in samples:

        if validate_image(
            sample["image_path"]
        ):

            valid_count += 1

        else:

            invalid_count += 1

    print()
    print("Dataset validation completed.")

    print(
        "Valid images:",
        valid_count
    )

    print(
        "Invalid images:",
        invalid_count
    )

    print()

    if samples:

        print("First sample:")

        print(
            samples[0]
        )