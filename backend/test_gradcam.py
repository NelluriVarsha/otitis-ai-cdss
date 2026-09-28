from PIL import Image
from gradcam import generate_gradcam


IMAGE_PATH = r"..\data\Otoscopic_Data\Acute Otitis Media\aom (1).jpg"


image = Image.open(IMAGE_PATH)

heatmap = generate_gradcam(image)

print("Grad-CAM generated successfully")
print("Heatmap shape:", heatmap.shape)
print("Heatmap minimum:", heatmap.min())
print("Heatmap maximum:", heatmap.max())