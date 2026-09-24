// =========================================================
// OtitisAI-CDSS
// Diagnosis Page JavaScript
// Multimodal: Otoscopic Image + Clinical Symptoms
// Includes: Diagnosis + Confidence + Severity + Recommendations
// =========================================================


// =========================================================
// API CONFIGURATION
// =========================================================

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const uploadArea =
    document.getElementById("uploadArea");

const analyzeButton =
    document.getElementById("analyzeButton");

const loadingMessage =
    document.getElementById("loadingMessage");

const errorMessage =
    document.getElementById("errorMessage");

const predictionResult =
    document.getElementById("predictionResult");

const confidenceResult =
    document.getElementById("confidenceResult");

const filenameResult =
    document.getElementById("filenameResult");


// =========================================================
// OPTIONAL RESULT ELEMENTS
// =========================================================

const severityResult =
    document.getElementById("severityResult");

const severityScoreResult =
    document.getElementById("severityScore");

const severityFactorsResult =
    document.getElementById("severityFactors");

const recommendationsList =
    document.getElementById("recommendationsList");

const precautionsList =
    document.getElementById("precautionsList");

const seekCareList =
    document.getElementById("whenToSeekCare");

const urgencyResult =
    document.getElementById("urgencyResult");


// =========================================================
// APPLICATION STATE
// =========================================================

let selectedFile = null;

let latestDiagnosis = null;


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeImageUpload();

        initializeAnalyzeButton();

        initializeResetButton();

        initializeNavigation();

        initializeSymptomControls();

    }
);


// =========================================================
// IMAGE UPLOAD INITIALIZATION
// =========================================================

function initializeImageUpload() {

    if (!imageInput) {
        return;
    }

    imageInput.addEventListener(
        "change",
        handleImageSelection
    );


    if (uploadArea) {

        uploadArea.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                uploadArea.classList.add(
                    "drag-over"
                );

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            () => {

                uploadArea.classList.remove(
                    "drag-over"
                );

            }
        );


        uploadArea.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                uploadArea.classList.remove(
                    "drag-over"
                );

                const files =
                    event.dataTransfer.files;

                if (
                    files &&
                    files.length > 0
                ) {

                    selectedFile =
                        files[0];

                    displayImagePreview(
                        selectedFile
                    );

                }

            }
        );

    }

}


// =========================================================
// HANDLE IMAGE SELECTION
// =========================================================

function handleImageSelection(event) {

    const files =
        event.target.files;

    if (
        !files ||
        files.length === 0
    ) {

        selectedFile = null;

        return;

    }

    selectedFile = files[0];

    displayImagePreview(
        selectedFile
    );

}


// =========================================================
// DISPLAY IMAGE PREVIEW
// =========================================================

function displayImagePreview(file) {

    if (!file) {
        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp"
    ];


    if (
        file.type &&
        !allowedTypes.includes(file.type)
    ) {

        showError(
            "Please select a JPG, JPEG, PNG, WEBP or BMP image."
        );

        selectedFile = null;

        return;

    }


    if (!imagePreview) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            imagePreview.src =
                event.target.result;

            imagePreview.style.display =
                "block";

        };


    reader.onerror =
        () => {

            showError(
                "Unable to preview the selected image."
            );

        };


    reader.readAsDataURL(file);

}


// =========================================================
// ANALYZE BUTTON
// =========================================================

function initializeAnalyzeButton() {

    if (!analyzeButton) {
        return;
    }


    analyzeButton.addEventListener(
        "click",
        analyzeImage
    );

}


// =========================================================
// MAIN ANALYSIS FUNCTION
// =========================================================

async function analyzeImage() {

    hideError();


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
    // COLLECT CLINICAL DATA
    // -----------------------------------------------------

    const symptoms =
        getSelectedSymptoms();


    const duration =
        getDuration();


    const age =
        getAge();


    // -----------------------------------------------------
    // CREATE FORM DATA
    // -----------------------------------------------------

    const formData =
        new FormData();


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
    // SHOW LOADING
    // -----------------------------------------------------

    showLoading();

    setAnalyzeButtonLoading(
        true
    );


    try {

        // -------------------------------------------------
        // SEND REQUEST TO FASTAPI
        // -------------------------------------------------

        const response =
            await fetch(
                `${API_URL}/api/predict`,
                {
                    method: "POST",
                    body: formData
                }
            );


        // -------------------------------------------------
        // READ JSON
        // -------------------------------------------------

        let data;


        try {

            data =
                await response.json();

        }
        catch (jsonError) {

            throw new Error(
                "The diagnosis server returned an invalid response."
            );

        }


        // -------------------------------------------------
        // HTTP ERROR
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Diagnosis request failed."
            );

        }


        // -------------------------------------------------
        // SERVER SUCCESS CHECK
        // -------------------------------------------------

        if (
            data.success === false
        ) {

            throw new Error(
                data.detail ||
                "The diagnosis server did not return a valid result."
            );

        }


        // -------------------------------------------------
        // NORMALIZE RESPONSE
        // -------------------------------------------------

        const result =
            normalizeDiagnosisResponse(
                data,
                symptoms,
                duration,
                age
            );


        // -------------------------------------------------
        // SAVE LATEST RESULT
        // -------------------------------------------------

        latestDiagnosis =
            result;


        // -------------------------------------------------
        // DISPLAY RESULT
        // -------------------------------------------------

        displayDiagnosisResult(
            result
        );


        // -------------------------------------------------
        // DISPLAY RECOMMENDATIONS
        // -------------------------------------------------

        displayRecommendations(
            result
        );


        // -------------------------------------------------
        // SAVE HISTORY
        // -------------------------------------------------

        saveDiagnosisToHistory(
            result
        );


        // -------------------------------------------------
        // SCROLL TO RESULTS
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

            message =
                error.message;

        }


        showError(
            message
        );

    }
    finally {

        hideLoading();

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


    const checkedSymptoms =
        document.querySelectorAll(
            'input[name="symptoms"]:checked'
        );


    checkedSymptoms.forEach(
        checkbox => {

            if (
                checkbox.value
            ) {

                symptoms.push(
                    checkbox.value.trim()
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

    const possibleElements = [

        document.getElementById(
            "duration"
        ),

        document.getElementById(
            "durationInput"
        ),

        document.getElementById(
            "symptomDuration"
        )

    ];


    for (
        const element
        of possibleElements
    ) {

        if (element) {

            return (
                element.value ||
                ""
            ).trim();

        }

    }


    const selected =
        document.querySelector(
            'select[name="duration"]'
        );


    if (selected) {

        return (
            selected.value ||
            ""
        ).trim();

    }


    return "";

}


// =========================================================
// GET AGE
// =========================================================

function getAge() {

    const possibleElements = [

        document.getElementById(
            "age"
        ),

        document.getElementById(
            "ageInput"
        ),

        document.getElementById(
            "patientAge"
        )

    ];


    for (
        const element
        of possibleElements
    ) {

        if (element) {

            return (
                element.value ||
                ""
            ).trim();

        }

    }


    return "";

}


// =========================================================
// NORMALIZE BACKEND RESPONSE
// =========================================================

function normalizeDiagnosisResponse(
    data,
    symptoms,
    duration,
    age
) {

    return {

        ...data,


        filename:
            data.filename ||
            (
                selectedFile
                    ? selectedFile.name
                    : "Uploaded image"
            ),


        prediction:
            data.prediction ||
            data.diagnosis ||
            "Unknown",


        class_index:
            data.class_index ??
            null,


        confidence:
            data.confidence ??
            null,


        confidence_percentage:
            data.confidence_percentage ??
            null,


        age:
            data.age ||
            age ||
            "",


        symptoms:
            Array.isArray(
                data.symptoms
            )
                ? data.symptoms
                : symptoms,


        duration:
            data.duration ||
            duration ||
            "",


        // -------------------------------------------------
        // SEVERITY
        // -------------------------------------------------

        severity:
            data.severity ||
            "Not available",


        severity_score:
            data.severity_score ??
            null,


        severity_factors:
            Array.isArray(
                data.severity_factors
            )
                ? data.severity_factors
                : [],


        // -------------------------------------------------
        // RECOMMENDATIONS
        // -------------------------------------------------

        recommendations:
            Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : [],


        precautions:
            Array.isArray(
                data.precautions
            )
                ? data.precautions
                : [],


        when_to_seek_care:
            Array.isArray(
                data.when_to_seek_care
            )
                ? data.when_to_seek_care
                : [],


        urgency:
            data.urgency ||
            "Clinical review recommended"

    };

}


// =========================================================
// DISPLAY DIAGNOSIS RESULT
// =========================================================

function displayDiagnosisResult(
    data
) {

    // -----------------------------------------------------
    // DIAGNOSIS
    // -----------------------------------------------------

    if (predictionResult) {

        predictionResult.textContent =
            data.prediction ||
            "Unknown";

    }


    // -----------------------------------------------------
    // CONFIDENCE
    // -----------------------------------------------------

    if (confidenceResult) {

        confidenceResult.textContent =
            formatConfidence(
                data.confidence_percentage,
                data.confidence
            );

    }


    // -----------------------------------------------------
    // FILENAME
    // -----------------------------------------------------

    if (filenameResult) {

        filenameResult.textContent =
            data.filename ||
            "Uploaded image";

    }


    // -----------------------------------------------------
    // SEVERITY
    // -----------------------------------------------------

    displaySeverity(
        data
    );


    // -----------------------------------------------------
    // OPTIONAL MULTIMODAL ELEMENTS
    // -----------------------------------------------------

    const imagePrediction =
        document.getElementById(
            "imagePrediction"
        );


    if (imagePrediction) {

        imagePrediction.textContent =
            data.image_prediction ||
            data.prediction ||
            "N/A";

    }


    const imageConfidence =
        document.getElementById(
            "imageConfidence"
        );


    if (imageConfidence) {

        imageConfidence.textContent =
            formatConfidence(
                data.image_confidence_percentage,
                data.image_confidence
            );

    }


    const clinicalEvidence =
        document.getElementById(
            "clinicalEvidence"
        );


    if (clinicalEvidence) {

        if (
            data.symptoms &&
            data.symptoms.length > 0
        ) {

            clinicalEvidence.textContent =
                data.symptoms.join(", ");

        }
        else {

            clinicalEvidence.textContent =
                "No symptoms provided";

        }

    }

}


// =========================================================
// DISPLAY SEVERITY
// =========================================================

function displaySeverity(
    data
) {

    const severity =
        data.severity ||
        "Not available";


    // -----------------------------------------------------
    // SEVERITY TEXT
    // -----------------------------------------------------

    if (severityResult) {

        severityResult.textContent =
            severity;

    }


    // -----------------------------------------------------
    // SEVERITY SCORE
    // -----------------------------------------------------

    if (severityScoreResult) {

        if (
            data.severity_score !== null &&
            data.severity_score !== undefined
        ) {

            severityScoreResult.textContent =
                data.severity_score;

        }
        else {

            severityScoreResult.textContent =
                "N/A";

        }

    }


    // -----------------------------------------------------
    // SEVERITY FACTORS
    // -----------------------------------------------------

    if (severityFactorsResult) {

        severityFactorsResult.innerHTML = "";


        const factors =
            Array.isArray(
                data.severity_factors
            )
                ? data.severity_factors
                : [];


        if (
            factors.length === 0
        ) {

            const item =
                document.createElement(
                    "li"
                );

            item.textContent =
                "No severity factors available.";

            severityFactorsResult.appendChild(
                item
            );

        }
        else {

            factors.forEach(
                factor => {

                    const item =
                        document.createElement(
                            "li"
                        );

                    item.textContent =
                        factor;

                    severityFactorsResult.appendChild(
                        item
                    );

                }
            );

        }

    }


    // -----------------------------------------------------
    // SEVERITY COLOR / CLASS
    // -----------------------------------------------------

    const severityContainer =
        document.getElementById(
            "severityContainer"
        );


    if (severityContainer) {

        severityContainer.classList.remove(
            "severity-mild",
            "severity-moderate",
            "severity-severe",
            "severity-unknown"
        );


        const normalized =
            severity.toLowerCase();


        if (
            normalized === "mild"
        ) {

            severityContainer.classList.add(
                "severity-mild"
            );

        }
        else if (
            normalized === "moderate"
        ) {

            severityContainer.classList.add(
                "severity-moderate"
            );

        }
        else if (
            normalized === "severe"
        ) {

            severityContainer.classList.add(
                "severity-severe"
            );

        }
        else {

            severityContainer.classList.add(
                "severity-unknown"
            );

        }

    }

}


// =========================================================
// FORMAT CONFIDENCE
// =========================================================

function formatConfidence(
    percentage,
    rawConfidence
) {

    if (
        percentage !== null &&
        percentage !== undefined &&
        !Number.isNaN(
            Number(percentage)
        )
    ) {

        return `${Number(percentage).toFixed(2)}%`;

    }


    if (
        rawConfidence !== null &&
        rawConfidence !== undefined &&
        !Number.isNaN(
            Number(rawConfidence)
        )
    ) {

        return `${(
            Number(rawConfidence) * 100
        ).toFixed(2)}%`;

    }


    return "N/A";

}


// =========================================================
// DISPLAY RECOMMENDATIONS
// =========================================================

function displayRecommendations(
    data
) {

    // -----------------------------------------------------
    // RECOMMENDATIONS
    // -----------------------------------------------------

    renderList(
        recommendationsList,
        data.recommendations,
        "No recommendations available."
    );


    // -----------------------------------------------------
    // PRECAUTIONS
    // -----------------------------------------------------

    renderList(
        precautionsList,
        data.precautions,
        "No precautions available."
    );


    // -----------------------------------------------------
    // WHEN TO SEEK CARE
    // -----------------------------------------------------

    renderList(
        seekCareList,
        data.when_to_seek_care,
        "No additional warning signs available."
    );


    // -----------------------------------------------------
    // URGENCY
    // -----------------------------------------------------

    if (urgencyResult) {

        urgencyResult.textContent =
            data.urgency ||
            "Clinical review recommended";

    }

}


// =========================================================
// GENERIC LIST RENDERER
// =========================================================

function renderList(
    element,
    items,
    emptyMessage
) {

    if (!element) {
        return;
    }


    element.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );

        li.textContent =
            emptyMessage;

        element.appendChild(
            li
        );

        return;

    }


    items.forEach(
        item => {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                item;

            element.appendChild(
                li
            );

        }
    );

}


// =========================================================
// SAVE DIAGNOSIS HISTORY
// =========================================================

function saveDiagnosisToHistory(
    result
) {

    try {

        const existing =
            localStorage.getItem(
                "otitisDiagnosisHistory"
            );


        let history = [];


        if (existing) {

            try {

                history =
                    JSON.parse(
                        existing
                    );

            }
            catch (error) {

                history = [];

            }

        }


        if (
            !Array.isArray(history)
        ) {

            history = [];

        }


        const historyItem = {

            id:
                Date.now(),


            timestamp:
                new Date().toISOString(),


            filename:
                result.filename,


            prediction:
                result.prediction,


            class_index:
                result.class_index,


            confidence:
                result.confidence,


            confidence_percentage:
                result.confidence_percentage,


            severity:
                result.severity,


            severity_score:
                result.severity_score,


            severity_factors:
                result.severity_factors,


            age:
                result.age,


            symptoms:
                result.symptoms,


            duration:
                result.duration,


            recommendations:
                result.recommendations,


            precautions:
                result.precautions,


            when_to_seek_care:
                result.when_to_seek_care,


            urgency:
                result.urgency

        };


        history.unshift(
            historyItem
        );


        // Keep latest 50 records
        history =
            history.slice(
                0,
                50
            );


        localStorage.setItem(
            "otitisDiagnosisHistory",
            JSON.stringify(
                history
            )
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
// RESET BUTTON
// =========================================================

function initializeResetButton() {

    const resetButton =
        document.getElementById(
            "resetButton"
        );


    if (!resetButton) {
        return;
    }


    resetButton.addEventListener(
        "click",
        resetDiagnosisForm
    );

}


// =========================================================
// RESET FORM
// =========================================================

function resetDiagnosisForm() {

    selectedFile = null;

    latestDiagnosis = null;


    if (imageInput) {

        imageInput.value = "";

    }


    if (imagePreview) {

        imagePreview.src = "";

        imagePreview.style.display =
            "none";

    }


    // -----------------------------------------------------
    // UNCHECK SYMPTOMS
    // -----------------------------------------------------

    const checkboxes =
        document.querySelectorAll(
            'input[name="symptoms"]'
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                false;

        }
    );


    // -----------------------------------------------------
    // RESET AGE
    // -----------------------------------------------------

    const ageInput =
        document.getElementById(
            "age"
        );


    if (ageInput) {

        ageInput.value = "";

    }


    // -----------------------------------------------------
    // RESET DURATION
    // -----------------------------------------------------

    const durationInput =
        document.getElementById(
            "duration"
        );


    if (durationInput) {

        durationInput.value = "";

    }


    // -----------------------------------------------------
    // CLEAR RESULTS
    // -----------------------------------------------------

    if (predictionResult) {

        predictionResult.textContent =
            "—";

    }


    if (confidenceResult) {

        confidenceResult.textContent =
            "—";

    }


    if (severityResult) {

        severityResult.textContent =
            "—";

    }


    if (severityScoreResult) {

        severityScoreResult.textContent =
            "—";

    }


    if (severityFactorsResult) {

        severityFactorsResult.innerHTML =
            "";

    }


    if (recommendationsList) {

        recommendationsList.innerHTML =
            "";

    }


    if (precautionsList) {

        precautionsList.innerHTML =
            "";

    }


    if (seekCareList) {

        seekCareList.innerHTML =
            "";

    }


    if (urgencyResult) {

        urgencyResult.textContent =
            "—";

    }


    hideError();

}


// =========================================================
// NAVIGATION
// =========================================================

function initializeNavigation() {

    const dashboardLinks =
        document.querySelectorAll(
            '[data-page="dashboard"]'
        );


    dashboardLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dashboard.html";

                }
            );

        }
    );


    const reportLinks =
        document.querySelectorAll(
            '[data-page="report"]'
        );


    reportLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "report.html";

                }
            );

        }
    );

}


// =========================================================
// SYMPTOM CONTROLS
// =========================================================

function initializeSymptomControls() {

    const symptomInputs =
        document.querySelectorAll(
            'input[name="symptoms"]'
        );


    symptomInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    input.parentElement
                        ?.classList.toggle(
                            "selected",
                            input.checked
                        );

                }
            );

        }
    );

}


// =========================================================
// SHOW LOADING
// =========================================================

function showLoading() {

    if (loadingMessage) {

        loadingMessage.style.display =
            "block";

        loadingMessage.textContent =
            "Analyzing otoscopic image and clinical information...";

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    if (loadingMessage) {

        loadingMessage.style.display =
            "none";

    }

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
// SHOW ERROR
// =========================================================

function showError(
    message
) {

    if (!errorMessage) {

        alert(message);

        return;

    }


    errorMessage.textContent =
        message;


    errorMessage.style.display =
        "block";

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent =
        "";


    errorMessage.style.display =
        "none";

}


// =========================================================
// SCROLL TO RESULTS
// =========================================================

function scrollToResults() {

    const results =
        document.getElementById(
            "results"
        );


    if (results) {

        setTimeout(
            () => {

                results.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
        );

        return;

    }


    const resultSection =
        document.querySelector(
            ".results-section"
        );


    if (resultSection) {

        setTimeout(
            () => {

                resultSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
        );

    }

}


// =========================================================
// CONNECTION TEST
// =========================================================

async function checkBackendConnection() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/health`
            );


        if (!response.ok) {

            return false;

        }


        const data =
            await response.json();


        return (
            data.status ===
            "healthy"
        );

    }
    catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );


        return false;

    }

}


// =========================================================
// EXPOSE FUNCTIONS GLOBALLY
// =========================================================

window.analyzeImage =
    analyzeImage;

window.resetDiagnosisForm =
    resetDiagnosisForm;

window.checkBackendConnection =
    checkBackendConnection;

window.getSelectedSymptoms =
    getSelectedSymptoms;

window.getDuration =
    getDuration;

window.getAge =
    getAge;