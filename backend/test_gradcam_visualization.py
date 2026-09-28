from PIL import Image

from gradcam_visualization import create_gradcam_overlay


IMAGE_PATH = r"..\data\Otoscopic_Data\Acute Otitis Media\aom (1).jpg"

OUTPUT_PATH = r"..\gradcam_result.jpg"


image = Image.open(IMAGE_PATH)

overlay = create_gradcam_overlay(image)

result = Image.fromarray(overlay)

result.save(OUTPUT_PATH)

print("Grad-CAM visualization generated successfully")
print("Saved to:", OUTPUT_PATH)