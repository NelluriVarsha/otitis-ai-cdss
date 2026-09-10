// =========================================================
// OtitisAI-CDSS - Diagnosis Page JavaScript
// =========================================================

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const uploadArea = document.getElementById("uploadArea");

const analyzeButton = document.getElementById("analyzeButton");

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

const predictionResult = document.getElementById("predictionResult");
const confidenceResult = document.getElementById("confidenceResult");
const filenameResult = document.getElementById("filenameResult");


// =========================================================
// SELECTED IMAGE
// =========================================================

let selectedFile = null;


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    setupImageUpload();

    setupAnalyzeButton();

    hideElement(loadingMessage);
    hideElement(errorMessage);

    hideRecommendationSection();

});


// =========================================================
// IMAGE UPLOAD
// =========================================================

function setupImageUpload() {

    if (!imageInput) {
        return;
    }


    imageInput.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            return;
        }


        // Check file type

        if (!file.type.startsWith("image/")) {

            showError(
                "Please select a valid image file."
            );

            imageInput.value = "";

            return;
        }


        selectedFile = file;

        hideElement(errorMessage);

        displayImagePreview(file);

    });

}


// =========================================================
// IMAGE PREVIEW
// =========================================================

function displayImagePreview(file) {

    if (!imagePreview) {
        return;
    }


    const reader = new FileReader();


    reader.onload = function (event) {

        imagePreview.src = event.target.result;

        imagePreview.style.display = "block";

    };


    reader.readAsDataURL(file);

}


// =========================================================
// ANALYZE BUTTON
// =========================================================

function setupAnalyzeButton() {

    if (!analyzeButton) {
        return;
    }


    analyzeButton.addEventListener(
        "click",
        analyzeImage
    );

}


// =========================================================
// ANALYZE IMAGE
// =========================================================

async function analyzeImage() {

    // -----------------------------------------------------
    // CHECK IMAGE
    // -----------------------------------------------------

    if (!selectedFile) {

        showError(
            "Please upload an otoscopic image first."
        );

        return;
    }


    // -----------------------------------------------------
    // GET CLINICAL DATA
    // -----------------------------------------------------

    const symptoms = getSelectedSymptoms();

    const duration = getDuration();

    const age = getAge();


    // -----------------------------------------------------
    // CREATE FORM DATA
    // -----------------------------------------------------

    const formData = new FormData();


    formData.append(
        "file",
        selectedFile
    );


    formData.append(
        "symptoms",
        symptoms.join(",")
    );


    formData.append(
        "duration",
        duration
    );


    formData.append(
        "age",
        age
    );


    // -----------------------------------------------------
    // UI STATE
    // -----------------------------------------------------

    hideElement(errorMessage);

    showElement(loadingMessage);

    setAnalyzeButtonLoading(true);


    try {

        // -------------------------------------------------
        // SEND REQUEST TO FASTAPI
        // -------------------------------------------------

        const response = await fetch(
            `${API_URL}/api/predict`,
            {
                method: "POST",
                body: formData
            }
        );


        // -------------------------------------------------
        // READ RESPONSE
        // -------------------------------------------------

        const data = await response.json();


        // -------------------------------------------------
        // CHECK SERVER ERROR
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Diagnosis request failed."
            );

        }


        // -------------------------------------------------
        // CHECK SUCCESS
        // -------------------------------------------------

        if (!data.success) {

            throw new Error(
                "The diagnosis server did not return a valid result."
            );

        }


        // -------------------------------------------------
        // DISPLAY DIAGNOSIS
        // -------------------------------------------------

        displayDiagnosisResult(data);


        // -------------------------------------------------
        // DISPLAY RECOMMENDATIONS
        // -------------------------------------------------

        displayRecommendations(data);


        // -------------------------------------------------
        // SAVE HISTORY
        // -------------------------------------------------

        saveDiagnosisToHistory(
            data
        );


        // -------------------------------------------------
        // SCROLL TO RESULT
        // -------------------------------------------------

        scrollToResults();

    }

    catch (error) {

        console.error(
            "Diagnosis error:",
            error
        );


        let message =
            "Unable to connect to the diagnosis server.";


        if (
            error &&
            error.message
        ) {

            message = error.message;

        }


        showError(
            message
        );

    }

    finally {

        hideElement(
            loadingMessage
        );

        setAnalyzeButtonLoading(
            false
        );

    }

}


// =========================================================
// GET SELECTED SYMPTOMS
// =========================================================

function getSelectedSymptoms() {

    const symptoms = [];


    /*
     * Supports checkboxes such as:
     *
     * <input type="checkbox"
     *        name="symptoms"
     *        value="ear pain">
     */


    const checkedSymptoms =
        document.querySelectorAll(
            'input[name="symptoms"]:checked'
        );


    checkedSymptoms.forEach(
        checkbox => {

            if (checkbox.value) {

                symptoms.push(
                    checkbox.value
                );

            }

        }
    );


    return symptoms;

}


// =========================================================
// GET DURATION
// =========================================================

function getDuration() {

    /*
     * Supports:
     *
     * <select id="duration">
     */

    const durationElement =
        document.getElementById(
            "duration"
        );


    if (!durationElement) {

        return "";

    }


    return durationElement.value || "";

}


// =========================================================
// GET AGE
// =========================================================

function getAge() {

    /*
     * Supports:
     *
     * <input id="age">
     */

    const ageElement =
        document.getElementById(
            "age"
        );


    if (!ageElement) {

        return "";

    }


    return ageElement.value || "";

}


// =========================================================
// DISPLAY DIAGNOSIS RESULT
// =========================================================

function displayDiagnosisResult(data) {

    if (predictionResult) {

        predictionResult.textContent =
            data.prediction ||
            "Unknown";

    }


    if (confidenceResult) {

        if (
            data.confidence_percentage !== null &&
            data.confidence_percentage !== undefined
        ) {

            confidenceResult.textContent =
                `${data.confidence_percentage}%`;

        }

        else if (
            data.confidence !== null &&
            data.confidence !== undefined
        ) {

            confidenceResult.textContent =
                `${(
                    Number(data.confidence) * 100
                ).toFixed(2)}%`;

        }

        else {

            confidenceResult.textContent =
                "N/A";

        }

    }


    if (filenameResult) {

        filenameResult.textContent =
            data.filename ||
            "Uploaded image";

    }

}


// =========================================================
// DISPLAY RECOMMENDATIONS
// =========================================================

function displayRecommendations(data) {

    const recommendationSection =
        document.getElementById(
            "recommendationSection"
        );


    const recommendationsList =
        document.getElementById(
            "recommendationsList"
        );


    const precautionsList =
        document.getElementById(
            "precautionsList"
        );


    const seekCareList =
        document.getElementById(
            "seekCareList"
        );


    const urgencyResult =
        document.getElementById(
            "urgencyResult"
        );


    // -----------------------------------------------------
    // SECTION
    // -----------------------------------------------------

    if (!recommendationSection) {

        return;

    }


    recommendationSection.style.display =
        "block";


    // -----------------------------------------------------
    // URGENCY
    // -----------------------------------------------------

    if (urgencyResult) {

        urgencyResult.textContent =
            data.urgency ||
            "Clinical review recommended";

    }


    // -----------------------------------------------------
    // RECOMMENDATIONS
    // -----------------------------------------------------

    if (recommendationsList) {

        recommendationsList.innerHTML = "";


        if (
            Array.isArray(
                data.recommendations
            ) &&
            data.recommendations.length > 0
        ) {

            data.recommendations.forEach(
                item => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        item;

                    recommendationsList.appendChild(
                        li
                    );

                }
            );

        }

        else {

            recommendationsList.innerHTML =
                "<li>No specific recommendations available.</li>";

        }

    }


    // -----------------------------------------------------
    // PRECAUTIONS
    // -----------------------------------------------------

    if (precautionsList) {

        precautionsList.innerHTML = "";


        if (
            Array.isArray(
                data.precautions
            ) &&
            data.precautions.length > 0
        ) {

            data.precautions.forEach(
                item => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        item;

                    precautionsList.appendChild(
                        li
                    );

                }
            );

        }

        else {

            precautionsList.innerHTML =
                "<li>No specific precautions available.</li>";

        }

    }


    // -----------------------------------------------------
    // WHEN TO SEEK CARE
    // -----------------------------------------------------

    if (seekCareList) {

        seekCareList.innerHTML = "";


        if (
            Array.isArray(
                data.when_to_seek_care
            ) &&
            data.when_to_seek_care.length > 0
        ) {

            data.when_to_seek_care.forEach(
                item => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        item;

                    seekCareList.appendChild(
                        li
                    );

                }
            );

        }

        else {

            seekCareList.innerHTML =
                "<li>Seek medical advice if symptoms persist or worsen.</li>";

        }

    }

}


// =========================================================
// HIDE RECOMMENDATION SECTION
// =========================================================

function hideRecommendationSection() {

    const section =
        document.getElementById(
            "recommendationSection"
        );


    if (section) {

        section.style.display =
            "none";

    }

}


// =========================================================
// SAVE DIAGNOSIS HISTORY
// =========================================================

function saveDiagnosisToHistory(data) {

    const HISTORY_KEY =
        "otitisDiagnosisHistory";


    let history = [];


    try {

        const existing =
            localStorage.getItem(
                HISTORY_KEY
            );


        if (existing) {

            history =
                JSON.parse(existing);

        }

    }

    catch (error) {

        console.error(
            "Unable to read diagnosis history:",
            error
        );

        history = [];

    }


    // -----------------------------------------------------
    // CREATE RECORD
    // -----------------------------------------------------

    const record = {

        id:
            Date.now(),

        timestamp:
            new Date().toISOString(),

        date:
            new Date().toLocaleDateString(),

        time:
            new Date().toLocaleTimeString(),

        filename:
            data.filename || "",

        prediction:
            data.prediction || "Unknown",

        class_index:
            data.class_index ?? null,

        confidence:
            data.confidence ?? null,

        confidence_percentage:
            data.confidence_percentage ?? null,

        age:
            data.age || "",

        symptoms:
            data.symptoms || [],

        duration:
            data.duration || "",

        recommendations:
            data.recommendations || [],

        precautions:
            data.precautions || [],

        when_to_seek_care:
            data.when_to_seek_care || [],

        urgency:
            data.urgency || ""

    };


    // -----------------------------------------------------
    // ADD TO HISTORY
    // -----------------------------------------------------

    history.unshift(
        record
    );


    // Keep only latest 50 records

    history =
        history.slice(
            0,
            50
        );


    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    try {

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history)
        );

    }

    catch (error) {

        console.error(
            "Unable to save diagnosis history:",
            error
        );

    }

}


// =========================================================
// GET DIAGNOSIS HISTORY
// =========================================================

function getDiagnosisHistory() {

    try {

        const history =
            localStorage.getItem(
                "otitisDiagnosisHistory"
            );


        if (!history) {

            return [];

        }


        return JSON.parse(
            history
        );

    }

    catch (error) {

        console.error(
            "Unable to load history:",
            error
        );

        return [];

    }

}


// =========================================================
// GET SINGLE DIAGNOSIS
// =========================================================

function getDiagnosisById(id) {

    const history =
        getDiagnosisHistory();


    return history.find(
        record =>
            String(record.id) ===
            String(id)
    );

}


// =========================================================
// CLEAR DIAGNOSIS HISTORY
// =========================================================

function clearDiagnosisHistory() {

    localStorage.removeItem(
        "otitisDiagnosisHistory"
    );

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    if (!errorMessage) {

        alert(message);

        return;

    }


    errorMessage.textContent =
        message;


    showElement(
        errorMessage
    );

}


// =========================================================
// SHOW ELEMENT
// =========================================================

function showElement(element) {

    if (!element) {

        return;

    }


    element.style.display =
        "";

}


// =========================================================
// HIDE ELEMENT
// =========================================================

function hideElement(element) {

    if (!element) {

        return;

    }


    element.style.display =
        "none";

}


// =========================================================
// ANALYZE BUTTON LOADING STATE
// =========================================================

function setAnalyzeButtonLoading(
    loading
) {

    if (!analyzeButton) {

        return;

    }


    if (loading) {

        analyzeButton.disabled =
            true;

        analyzeButton.dataset.originalText =
            analyzeButton.textContent;

        analyzeButton.textContent =
            "Analyzing...";

    }

    else {

        analyzeButton.disabled =
            false;

        analyzeButton.textContent =
            analyzeButton.dataset.originalText ||
            "Analyze Image";

    }

}


// =========================================================
// SCROLL TO RESULTS
// =========================================================

function scrollToResults() {

    const resultSection =
        document.querySelector(
            ".result-section"
        );


    if (
        resultSection &&
        typeof resultSection.scrollIntoView ===
        "function"
    ) {

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// =========================================================
// EXPORT FUNCTIONS
// =========================================================
// These functions can also be used by dashboard.js
// and report.js.

window.getDiagnosisHistory =
    getDiagnosisHistory;

window.getDiagnosisById =
    getDiagnosisById;

window.clearDiagnosisHistory =
    clearDiagnosisHistory;