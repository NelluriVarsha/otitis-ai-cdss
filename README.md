# OtitisAI-CDSS 🩺

## AI-Based Automated Otitis Media Diagnosis and Clinical Decision Support System

**OtitisAI-CDSS** is an AI-powered clinical decision support system designed to assist in the analysis and classification of **Otitis Media using otoscopic images**. The system combines deep learning-based feature extraction, machine learning classification, Explainable AI, and a web-based interface to provide an end-to-end diagnostic support workflow.

> **Note:** This project is developed for academic and research purposes and is not intended to replace professional medical diagnosis or clinical decision-making.

---

##  Project Overview

Otitis Media is a common ear condition that can be identified through examination of the tympanic membrane using an otoscope. This project aims to assist in the analysis of otoscopic images using **Computer Vision and Machine Learning techniques**.

The system extracts meaningful visual features from uploaded otoscopic images using **DenseNet121** and performs classification using a **K-Nearest Neighbors (KNN)** model.

The prediction is presented through a responsive web application along with confidence information, severity assessment, clinical recommendations, and Explainable AI visualization using **Grad-CAM**.

---

##  Key Features

* 🖼️ Otoscopic image upload and analysis
* 🧠 DenseNet121-based deep feature extraction
* 🤖 KNN-based image classification
* 📊 Diagnosis confidence scoring
* 🩺 Severity assessment
* 💡 Symptom-based clinical recommendations
* 🔍 Grad-CAM-based Explainable AI visualization
* 📋 Diagnosis history tracking
* 📈 Interactive clinical dashboard
* 📄 Automated diagnosis report generation
* 🌐 FastAPI-based backend
* 💻 Responsive web interface

---

##  AI/ML Workflow

```text
             Otoscopic Image
                    ↓
           Image Preprocessing
                    ↓
          DenseNet121 Model
                    ↓
          Feature Extraction
                    ↓
          KNN Classification
                    ↓
       Diagnosis + Confidence
                    ↓
          Severity Assessment
                    ↓
     Clinical Recommendation Engine
                    ↓
        Grad-CAM Visualization
                    ↓
       Clinical Report / Dashboard
```

---

##  Technologies Used

### Machine Learning & AI

* Python
* TensorFlow
* DenseNet121
* K-Nearest Neighbors (KNN)
* Computer Vision
* Explainable AI
* Grad-CAM

### Backend

* FastAPI
* REST API
* Python

### Image Processing

* OpenCV
* NumPy
* Image preprocessing

### Frontend

* HTML5
* CSS3
* JavaScript

### Development Tools

* Git
* GitHub
* Visual Studio Code

---

##  Project Structure

```text
otitis_ai_cdss/
│
├── backend/
│   ├── main.py
│   ├── predictor.py
│   ├── recommendation_engine.py
│   ├── severity_engine.py
│   ├── gradcam.py
│   ├── gradcam_visualization.py
│   ├── model/
│   └── train_knn.py
│
├── frontend/
│   ├── index.html
│   ├── app.html
│   ├── dashboard.html
│   ├── report.html
│   ├── app.js
│   ├── dashboard.js
│   ├── report.js
│   ├── index.css
│   ├── dashboard.css
│   └── report.css
│
├── data/
│
├── trained_models/
│
├── training/
│
├── .gitignore
│
└── README.md
```

---

## ⚙️ System Modules

### 1. Image Analysis

The user uploads an otoscopic image through the web interface. The image is preprocessed before being passed to the deep learning feature extractor.

### 2. Feature Extraction

**DenseNet121** is used to extract high-level visual features from the otoscopic image.

### 3. Classification

The extracted features are passed to a **K-Nearest Neighbors (KNN)** classifier to determine the predicted diagnostic class.

### 4. Severity Assessment

The system provides a severity assessment based on the available prediction and clinical information.

### 5. Clinical Recommendations

The recommendation engine generates relevant guidance based on the predicted condition and entered symptoms.

### 6. Explainable AI

**Grad-CAM** is integrated to generate a visual heatmap highlighting regions of the image associated with the DenseNet121 feature representation.

### 7. Dashboard

The dashboard provides:

* Total diagnoses
* Average confidence
* Common diagnosis
* Low-confidence predictions
* Diagnosis history
* Detailed diagnosis information

### 8. Clinical Report

The reporting module presents the diagnosis, confidence, severity, symptoms, recommendations, precautions, and visual evidence in a structured report format.

---

## 🚀 Installation and Setup

### Prerequisites

Make sure the following are installed:

* Python 3.11+
* Git
* Web browser
* Required Python packages

### Clone the Repository

```bash
git clone https://github.com/NelluriVarsha/otitis-ai-cdss.git
cd otitis-ai-cdss
```

### Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

### Start the Frontend

Open another terminal:

```bash
cd frontend
python -m http.server 5500
```

Open the application in your browser:

```text
http://127.0.0.1:5500/index.html
```

---

##  Application Workflow

1. Open the OtitisAI-CDSS web application.
2. Navigate to the **Diagnosis** page.
3. Upload an otoscopic image.
4. Enter patient-related symptoms and information.
5. Submit the diagnosis request.
6. The backend processes the image.
7. DenseNet121 extracts visual features.
8. KNN predicts the diagnostic class.
9. The system calculates confidence and severity.
10. Clinical recommendations are generated.
11. Grad-CAM produces an explainability visualization.
12. The result is stored in diagnosis history.
13. The user can view the result through the dashboard or generate a report.

---

##  Dashboard

The system includes an interactive dashboard that provides an overview of previous diagnosis results.

It displays:

* Total number of diagnoses
* Average prediction confidence
* Commonly predicted diagnosis
* Low-confidence predictions
* Searchable diagnosis history
* Detailed diagnosis information

---

##  Explainable AI

The system uses **Grad-CAM (Gradient-weighted Class Activation Mapping)** to provide visual explanations for the deep learning feature representation.

The generated heatmap helps identify regions of the otoscopic image that contributed to the visual representation used by the AI pipeline.

This provides greater transparency compared with presenting only a predicted diagnosis.

---

##  Clinical Report

The report module provides a structured summary containing:

* Patient information
* Uploaded image information
* Predicted diagnosis
* Confidence score
* Severity
* Symptoms
* Clinical recommendations
* Precautions
* When-to-seek-care guidance
* Grad-CAM visual evidence

---

##  Future Enhancements

Future versions of OtitisAI-CDSS could include:

* Larger and more diverse otoscopic image datasets
* Advanced CNN and Vision Transformer architectures
* Improved model validation and performance evaluation
* Multi-model ensemble learning
* Real-time clinical decision support
* Secure patient data management
* Cloud deployment
* Doctor authentication and role-based access
* Integration with electronic health records
* Enhanced medical image segmentation
* More advanced Explainable AI techniques

---

##  Applications

The system can be explored for:

* Academic research
* Medical AI research
* Otoscopic image analysis
* Computer Vision applications
* Explainable AI research
* Clinical decision-support prototypes
* Healthcare technology demonstrations

---

##  Disclaimer

OtitisAI-CDSS is an **academic/research prototype**. The predictions and recommendations generated by this system should not be considered a substitute for examination, diagnosis, or treatment by a qualified healthcare professional.

