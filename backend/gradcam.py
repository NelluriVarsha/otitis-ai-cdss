import numpy as np
import tensorflow as tf

from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input


# Load DenseNet121 with convolutional feature maps
base_model = DenseNet121(
    weights="imagenet",
    include_top=False
)


# Model that returns the final convolutional feature maps
grad_model = tf.keras.models.Model(
    inputs=base_model.input,
    outputs=base_model.output
)


def generate_gradcam(image):
    """
    Generate a Grad-CAM heatmap for an otoscopic image.

    The existing KNN classifier is not modified.
    Grad-CAM explains the DenseNet121 CNN feature representation.
    """

    # Convert PIL image to RGB
    image = image.convert("RGB")

    # Resize image
    image = image.resize((128, 128))

    # Convert to NumPy array
    image_array = np.array(image, dtype=np.float32)

    # Add batch dimension
    image_array = np.expand_dims(image_array, axis=0)

    # DenseNet preprocessing
    image_array = preprocess_input(image_array)

    # IMPORTANT:
    # Convert NumPy array to TensorFlow tensor
    image_tensor = tf.convert_to_tensor(
        image_array,
        dtype=tf.float32
    )

    # Forward pass
    with tf.GradientTape() as tape:

        # Watch the TensorFlow tensor
        tape.watch(image_tensor)

        # Get convolutional feature maps
        conv_output = grad_model(
            image_tensor,
            training=False
        )

        # Explanation target
        target = tf.reduce_mean(conv_output)

    # Calculate gradients
    gradients = tape.gradient(
        target,
        conv_output
    )

    if gradients is None:
        raise RuntimeError(
            "Unable to calculate Grad-CAM gradients."
        )

    # Global average pooling of gradients
    weights = tf.reduce_mean(
        gradients,
        axis=(1, 2)
    )

    # Remove batch dimension
    conv_output = conv_output[0]
    weights = weights[0]

    # Weighted combination of feature maps
    cam = tf.reduce_sum(
        conv_output * weights,
        axis=-1
    )

    # ReLU
    cam = tf.maximum(cam, 0)

    # Normalize between 0 and 1
    max_value = tf.reduce_max(cam)

    if max_value > 0:
        cam = cam / max_value

    return cam.numpy()