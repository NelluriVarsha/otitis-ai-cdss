// ============================================================
// OtitisAI-CDSS - Dashboard JavaScript
// ============================================================

const HISTORY_KEY = "otitisDiagnosisHistory";


// ============================================================
// DOM ELEMENTS
// ============================================================

const totalDiagnoses = document.getElementById("totalDiagnoses");
const averageConfidence = document.getElementById("averageConfidence");
const commonDiagnosis = document.getElementById("commonDiagnosis");
const lowConfidenceCount = document.getElementById("lowConfidenceCount");

const diagnosisTableBody = document.getElementById("diagnosisTableBody");

const emptyState = document.getElementById("emptyState");
const noSearchResults = document.getElementById("noSearchResults");

const searchInput = document.getElementById("searchInput");

const refreshButton = document.getElementById("refreshButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const detailsSection = document.getElementById("detailsSection");
const closeDetailsButton = document.getElementById("closeDetailsButton");

const detailDiagnosis = document.getElementById("detailDiagnosis");
const detailConfidence = document.getElementById("detailConfidence");
const detailDate = document.getElementById("detailDate");
const detailAge = document.getElementById("detailAge");
const detailDuration = document.getElementById("detailDuration");
const detailFilename = document.getElementById("detailFilename");

const detailSymptoms = document.getElementById("detailSymptoms");
const detailRecommendations =
    document.getElementById("detailRecommendations");

const detailPrecautions =
    document.getElementById("detailPrecautions");

const detailSeekCare =
    document.getElementById("detailSeekCare");

const detailUrgency =
    document.getElementById("detailUrgency");

const viewReportButton =
    document.getElementById("viewReportButton");


// ============================================================
// GET HISTORY
// ============================================================

function getHistory() {
    try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);

        if (!storedHistory) {
            return [];
        }

        const parsedHistory = JSON.parse(storedHistory);

        return Array.isArray(parsedHistory)
            ? parsedHistory
            : [];

    } catch (error) {
        console.error("Error reading diagnosis history:", error);
        return [];
    }
}


// ============================================================
// SAVE HISTORY
// ============================================================

function saveHistory(history) {
    try {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history)
        );

        return true;

    } catch (error) {
        console.error("Error saving diagnosis history:", error);
        return false;
    }
}


// ============================================================
// GET DIAGNOSIS
// ============================================================

function getDiagnosis(record) {
    return (
        record?.prediction ||
        record?.diagnosis ||
        record?.result ||
        "Unknown"
    );
}


// ============================================================
// GET FILENAME
// ============================================================

function getFilename(record) {
    return (
        record?.filename ||
        record?.fileName ||
        record?.imageName ||
        "Unknown image"
    );
}


// ============================================================
// GET SYMPTOMS
// ============================================================

function getSymptoms(record) {

    const symptoms = record?.symptoms;

    if (Array.isArray(symptoms)) {
        return symptoms;
    }

    if (typeof symptoms === "string" && symptoms.trim()) {
        return symptoms
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


// ============================================================
// GET RECOMMENDATIONS
// ============================================================

function getRecommendations(record) {

    const recommendations = record?.recommendations;

    if (Array.isArray(recommendations)) {
        return recommendations;
    }

    if (
        typeof recommendations === "string" &&
        recommendations.trim()
    ) {
        return [recommendations];
    }

    return [];
}


// ============================================================
// GET PRECAUTIONS
// ============================================================

function getPrecautions(record) {

    const precautions = record?.precautions;

    if (Array.isArray(precautions)) {
        return precautions;
    }

    if (
        typeof precautions === "string" &&
        precautions.trim()
    ) {
        return [precautions];
    }

    return [];
}


// ============================================================
// GET SEEK CARE INFORMATION
// ============================================================

function getSeekCare(record) {

    const seekCare = record?.when_to_seek_care;

    if (Array.isArray(seekCare)) {
        return seekCare;
    }

    if (
        typeof seekCare === "string" &&
        seekCare.trim()
    ) {
        return [seekCare];
    }

    return [];
}


// ============================================================
// GET CONFIDENCE NUMBER
// ============================================================

function getConfidenceNumber(record) {

    let confidence =
        record?.confidence_percentage ??
        record?.confidence;

    if (
        confidence === null ||
        confidence === undefined ||
        confidence === ""
    ) {
        return null;
    }

    confidence = Number(confidence);

    if (Number.isNaN(confidence)) {
        return null;
    }

    // Backend confidence can be 0-1
    if (confidence >= 0 && confidence <= 1) {
        confidence = confidence * 100;
    }

    // Keep confidence inside valid percentage range
    confidence = Math.max(
        0,
        Math.min(100, confidence)
    );

    return confidence;
}


// ============================================================
// FORMAT CONFIDENCE
// ============================================================

function formatConfidence(record) {

    const confidence = getConfidenceNumber(record);

    if (confidence === null) {
        return "N/A";
    }

    return `${confidence.toFixed(1)}%`;
}


// ============================================================
// CONFIDENCE BADGE
// ============================================================

function getConfidenceBadge(record) {

    const confidence = getConfidenceNumber(record);

    if (confidence === null) {
        return {
            text: "N/A",
            className: "confidence-unknown"
        };
    }

    if (confidence >= 80) {
        return {
            text: `${confidence.toFixed(1)}%`,
            className: "confidence-high"
        };
    }

    if (confidence >= 60) {
        return {
            text: `${confidence.toFixed(1)}%`,
            className: "confidence-medium"
        };
    }

    return {
        text: `${confidence.toFixed(1)}%`,
        className: "confidence-low"
    };
}


// ============================================================
// GET DATE
// ============================================================

function getDateValue(record) {

    return (
        record?.date ||
        record?.timestamp ||
        record?.createdAt ||
        record?.created_at ||
        null
    );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(record) {

    const dateValue = getDateValue(record);

    if (!dateValue) {
        return "Unknown";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleString();
}


// ============================================================
// FORMAT AGE
// ============================================================

function formatAge(record) {

    const age = record?.age;

    if (
        age === undefined ||
        age === null ||
        String(age).trim() === ""
    ) {
        return "Not provided";
    }

    return `${age} years`;
}


// ============================================================
// FORMAT DURATION
// ============================================================

function formatDuration(record) {

    const duration =
        record?.duration ||
        record?.symptomDuration;

    if (
        duration === undefined ||
        duration === null ||
        String(duration).trim() === ""
    ) {
        return "Not provided";
    }

    return String(duration);
}


// ============================================================
// SAFE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(history) {

    // Total diagnoses
    if (totalDiagnoses) {
        totalDiagnoses.textContent = history.length;
    }


    // No records
    if (history.length === 0) {

        if (averageConfidence) {
            averageConfidence.textContent = "0%";
        }

        if (commonDiagnosis) {
            commonDiagnosis.textContent = "—";
        }

        if (lowConfidenceCount) {
            lowConfidenceCount.textContent = "0";
        }

        return;
    }


    // --------------------------------------------------------
    // Average confidence
    // --------------------------------------------------------

    const confidenceValues = history
        .map(record => getConfidenceNumber(record))
        .filter(value => value !== null);

    if (averageConfidence) {

        if (confidenceValues.length > 0) {

            const total = confidenceValues.reduce(
                (sum, value) => sum + value,
                0
            );

            const average =
                total / confidenceValues.length;

            averageConfidence.textContent =
                `${average.toFixed(1)}%`;

        } else {

            averageConfidence.textContent = "N/A";
        }
    }


    // --------------------------------------------------------
    // Low confidence count
    // --------------------------------------------------------

    const lowConfidence = history.filter(record => {

        const confidence =
            getConfidenceNumber(record);

        return (
            confidence !== null &&
            confidence < 60
        );

    }).length;

    if (lowConfidenceCount) {
        lowConfidenceCount.textContent =
            lowConfidence;
    }


    // --------------------------------------------------------
    // Most common diagnosis
    // --------------------------------------------------------

    const diagnosisCounts = {};

    history.forEach(record => {

        const diagnosis =
            getDiagnosis(record);

        if (!diagnosisCounts[diagnosis]) {
            diagnosisCounts[diagnosis] = 0;
        }

        diagnosisCounts[diagnosis]++;
    });


    let mostCommon = "—";
    let highestCount = 0;

    Object.entries(diagnosisCounts).forEach(
        ([diagnosis, count]) => {

            if (count > highestCount) {

                highestCount = count;
                mostCommon = diagnosis;
            }
        }
    );


    if (commonDiagnosis) {
        commonDiagnosis.textContent =
            mostCommon;
    }
}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory(history = getHistory()) {

    if (!diagnosisTableBody) {
        return;
    }

    diagnosisTableBody.innerHTML = "";


    // No history
    if (history.length === 0) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        if (noSearchResults) {
            noSearchResults.style.display = "none";
        }

        return;
    }


    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (noSearchResults) {
        noSearchResults.style.display = "none";
    }


    history.forEach((record, index) => {

        const row = document.createElement("tr");

        const diagnosis =
            getDiagnosis(record);

        const filename =
            getFilename(record);

        const symptoms =
            getSymptoms(record);

        const confidenceBadge =
            getConfidenceBadge(record);


        const symptomsText =
            symptoms.length > 0
                ? symptoms.join(", ")
                : "None";


        row.innerHTML = `
            <td>
                ${escapeHTML(formatDate(record))}
            </td>

            <td>
                <span class="image-name">
                    ${escapeHTML(filename)}
                </span>
            </td>

            <td>
                <span class="diagnosis-name">
                    ${escapeHTML(diagnosis)}
                </span>
            </td>

            <td>
                <span class="confidence-badge ${confidenceBadge.className}">
                    ${escapeHTML(confidenceBadge.text)}
                </span>
            </td>

            <td>
                <span class="symptoms-text">
                    ${escapeHTML(symptomsText)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="view-button"
                    data-index="${index}">
                    View Details
                </button>
            </td>
        `;


        const viewButton =
            row.querySelector(".view-button");

        if (viewButton) {

            viewButton.addEventListener(
                "click",
                () => showDetails(record)
            );
        }


        diagnosisTableBody.appendChild(row);
    });
}


// ============================================================
// SHOW DETAILS
// ============================================================

function showDetails(record) {

    if (!record) {
        return;
    }


    // Show details section
    if (detailsSection) {
        detailsSection.style.display = "block";
    }


    // Diagnosis
    if (detailDiagnosis) {
        detailDiagnosis.textContent =
            getDiagnosis(record);
    }


    // Confidence
    if (detailConfidence) {
        detailConfidence.textContent =
            formatConfidence(record);
    }


    // Date
    if (detailDate) {
        detailDate.textContent =
            formatDate(record);
    }


    // Age
    if (detailAge) {
        detailAge.textContent =
            formatAge(record);
    }


    // Duration
    if (detailDuration) {
        detailDuration.textContent =
            formatDuration(record);
    }


    // Filename
    if (detailFilename) {
        detailFilename.textContent =
            getFilename(record);
    }


    // Symptoms
    if (detailSymptoms) {

        const symptoms =
            getSymptoms(record);

        if (symptoms.length > 0) {

            detailSymptoms.innerHTML =
                symptoms
                    .map(
                        symptom =>
                            `<span class="symptom-tag">
                                ${escapeHTML(symptom)}
                            </span>`
                    )
                    .join("");

        } else {

            detailSymptoms.textContent =
                "No symptoms provided.";
        }
    }


    // Recommendations
    populateList(
        detailRecommendations,
        getRecommendations(record),
        "No recommendations available."
    );


    // Precautions
    populateList(
        detailPrecautions,
        getPrecautions(record),
        "No precautions available."
    );


    // When to seek care
    populateList(
        detailSeekCare,
        getSeekCare(record),
        "No additional care guidance available."
    );


    // Urgency
    if (detailUrgency) {

        detailUrgency.textContent =
            record?.urgency ||
            "Clinical confirmation recommended.";
    }


    // Save selected report
    try {

        sessionStorage.setItem(
            "selectedDiagnosisReport",
            JSON.stringify(record)
        );

    } catch (error) {

        console.error(
            "Unable to save selected report:",
            error
        );
    }


    // Scroll to details
    setTimeout(() => {

        if (detailsSection) {

            detailsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    }, 50);
}


// ============================================================
// POPULATE LIST
// ============================================================

function populateList(
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
            document.createElement("li");

        li.textContent =
            emptyMessage;

        element.appendChild(li);

        return;
    }


    items.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent =
            item;

        element.appendChild(li);
    });
}


// ============================================================
// SEARCH HISTORY
// ============================================================

function searchHistory() {

    const history =
        getHistory();

    const query =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";


    if (!query) {

        renderHistory(history);
        return;
    }


    const filteredHistory =
        history.filter(record => {

            const diagnosis =
                getDiagnosis(record)
                    .toLowerCase();

            const filename =
                getFilename(record)
                    .toLowerCase();

            const symptoms =
                getSymptoms(record)
                    .join(" ")
                    .toLowerCase();

            const duration =
                formatDuration(record)
                    .toLowerCase();

            const age =
                String(record?.age || "")
                    .toLowerCase();

            return (
                diagnosis.includes(query) ||
                filename.includes(query) ||
                symptoms.includes(query) ||
                duration.includes(query) ||
                age.includes(query)
            );
        });


    if (
        filteredHistory.length === 0
    ) {

        if (diagnosisTableBody) {
            diagnosisTableBody.innerHTML = "";
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        if (noSearchResults) {
            noSearchResults.style.display = "block";
        }

        return;
    }


    renderHistory(filteredHistory);
}


// ============================================================
// CLEAR HISTORY
// ============================================================

function clearHistory() {

    const history =
        getHistory();

    if (history.length === 0) {

        alert("There is no diagnosis history to clear.");
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to clear all diagnosis history?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        HISTORY_KEY
    );


    closeDetails();


    updateStatistics([]);
    renderHistory([]);


    if (searchInput) {
        searchInput.value = "";
    }


    alert("Diagnosis history cleared successfully.");
}


// ============================================================
// CLOSE DETAILS
// ============================================================

function closeDetails() {

    if (detailsSection) {

        detailsSection.style.display =
            "none";
    }
}


// ============================================================
// REFRESH DASHBOARD
// ============================================================

function refreshDashboard() {

    const history =
        getHistory();


    updateStatistics(history);


    if (
        searchInput &&
        searchInput.value.trim()
    ) {

        searchHistory();

    } else {

        renderHistory(history);
    }


    closeDetails();
}


// ============================================================
// VIEW REPORT
// ============================================================

function viewReport() {

    const selectedReport =
        sessionStorage.getItem(
            "selectedDiagnosisReport"
        );


    if (!selectedReport) {

        alert(
            "Please select a diagnosis before viewing the report."
        );

        return;
    }


    window.location.href =
        "report.html";
}


// ============================================================
// EVENT LISTENERS
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        searchHistory
    );
}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        refreshDashboard
    );
}


if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        clearHistory
    );
}


if (closeDetailsButton) {

    closeDetailsButton.addEventListener(
        "click",
        closeDetails
    );
}


if (viewReportButton) {

    viewReportButton.addEventListener(
        "click",
        viewReport
    );
}


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const history =
            getHistory();

        updateStatistics(history);
        renderHistory(history);

    }
);


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.refreshOtitisDashboard =
    refreshDashboard;

window.getOtitisDiagnosisHistory =
    getHistory;

window.showOtitisDiagnosisDetails =
    showDetails;

window.clearOtitisDiagnosisHistory =
    clearHistory;