import cv2
import numpy as np
from PIL import Image

from gradcam import generate_gradcam


def create_gradcam_overlay(image):
    """
    Generate a Grad-CAM heatmap and overlay it
    on the original otoscopic image.
    """

    # Generate Grad-CAM
    heatmap = generate_gradcam(image)

    # Convert heatmap to 0-255
    heatmap = np.uint8(255 * heatmap)

    # Resize heatmap to original image size
    original = np.array(image.convert("RGB"))

    height, width = original.shape[:2]

    heatmap = cv2.resize(
        heatmap,
        (width, height)
    )

    # Apply OpenCV color map
    colored_heatmap = cv2.applyColorMap(
        heatmap,
        cv2.COLORMAP_JET
    )

    # OpenCV uses BGR, convert to RGB
    colored_heatmap = cv2.cvtColor(
        colored_heatmap,
        cv2.COLOR_BGR2RGB
    )

    # Convert original image to uint8
    original = np.uint8(original)

    # Blend original image and heatmap
    overlay = cv2.addWeighted(
        original,
        0.6,
        colored_heatmap,
        0.4,
        0
    )

    return overlay