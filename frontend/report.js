// ============================================================
// OtitisAI-CDSS - Report JavaScript
// ============================================================

const REPORT_STORAGE_KEY = "selectedDiagnosisReport";


// ============================================================
// DOM ELEMENTS
// ============================================================

const reportStatus =
    document.getElementById("reportStatus");

const reportDate =
    document.getElementById("reportDate");

const reportDiagnosis =
    document.getElementById("reportDiagnosis");

const reportConfidence =
    document.getElementById("reportConfidence");

const reportSeverity =
    document.getElementById("reportSeverity");

const reportSeverityScore =
    document.getElementById("reportSeverityScore");

const reportAge =
    document.getElementById("reportAge");

const reportDuration =
    document.getElementById("reportDuration");

const reportFilename =
    document.getElementById("reportFilename");

const reportDiagnosisDate =
    document.getElementById("reportDiagnosisDate");

const reportImageFilename =
    document.getElementById("reportImageFilename");

const reportSymptoms =
    document.getElementById("reportSymptoms");

const reportSeverityFactors =
    document.getElementById("reportSeverityFactors");

const reportRecommendations =
    document.getElementById("reportRecommendations");

const reportPrecautions =
    document.getElementById("reportPrecautions");

const reportSeekCare =
    document.getElementById("reportSeekCare");

const reportUrgency =
    document.getElementById("reportUrgency");

const printReportButton =
    document.getElementById("printReportButton");

const printReportButtonBottom =
    document.getElementById(
        "printReportButtonBottom"
    );


// ============================================================
// GET SELECTED REPORT
// ============================================================

function getSelectedReport() {

    try {

        const storedReport =
            sessionStorage.getItem(
                REPORT_STORAGE_KEY
            );

        if (!storedReport) {
            return null;
        }

        return JSON.parse(storedReport);

    } catch (error) {

        console.error(
            "Error reading selected diagnosis:",
            error
        );

        return null;
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

    const symptoms =
        record?.symptoms;

    if (Array.isArray(symptoms)) {
        return symptoms;
    }

    if (
        typeof symptoms === "string" &&
        symptoms.trim()
    ) {

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

    const recommendations =
        record?.recommendations;

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

    const precautions =
        record?.precautions;

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
// GET WHEN TO SEEK CARE
// ============================================================

function getSeekCare(record) {

    const seekCare =
        record?.when_to_seek_care;

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
// GET SEVERITY FACTORS
// ============================================================

function getSeverityFactors(record) {

    const factors =
        record?.severity_factors;

    if (Array.isArray(factors)) {
        return factors;
    }

    if (
        typeof factors === "string" &&
        factors.trim()
    ) {

        return factors
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


// ============================================================
// GET CONFIDENCE
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

    // Backend may return 0-1
    if (
        confidence >= 0 &&
        confidence <= 1
    ) {
        confidence *= 100;
    }

    return Math.max(
        0,
        Math.min(100, confidence)
    );
}


// ============================================================
// FORMAT CONFIDENCE
// ============================================================

function formatConfidence(record) {

    const confidence =
        getConfidenceNumber(record);

    if (confidence === null) {
        return "N/A";
    }

    return `${confidence.toFixed(1)}%`;
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

function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString();
}


// ============================================================
// FORMAT AGE
// ============================================================

function formatAge(record) {

    const age =
        record?.age;

    if (
        age === null ||
        age === undefined ||
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
        duration === null ||
        duration === undefined ||
        String(duration).trim() === ""
    ) {
        return "Not provided";
    }

    return String(duration);
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
// POPULATE SYMPTOMS
// ============================================================

function populateSymptoms(symptoms) {

    if (!reportSymptoms) {
        return;
    }

    reportSymptoms.innerHTML = "";


    if (
        !Array.isArray(symptoms) ||
        symptoms.length === 0
    ) {

        const empty =
            document.createElement("span");

        empty.className =
            "empty-value";

        empty.textContent =
            "No symptoms provided.";

        reportSymptoms.appendChild(empty);

        return;
    }


    symptoms.forEach(symptom => {

        const tag =
            document.createElement("span");

        tag.className =
            "symptom-tag";

        tag.textContent =
            symptom;

        reportSymptoms.appendChild(tag);
    });
}


// ============================================================
// LOAD REPORT
// ============================================================

function loadReport() {

    const record =
        getSelectedReport();


    // --------------------------------------------------------
    // No report selected
    // --------------------------------------------------------

    if (!record) {

        console.warn(
            "No selected diagnosis report found."
        );


        if (reportStatus) {
            reportStatus.textContent =
                "No Diagnosis Report Selected";
        }


        if (reportDate) {
            reportDate.textContent =
                "Please complete a diagnosis first.";
        }


        if (reportDiagnosis) {
            reportDiagnosis.textContent =
                "No report available";
        }


        if (reportConfidence) {
            reportConfidence.textContent =
                "N/A";
        }


        if (reportSeverity) {
            reportSeverity.textContent =
                "N/A";
        }


        if (reportSeverityScore) {
            reportSeverityScore.textContent =
                "N/A";
        }


        return;
    }


    // --------------------------------------------------------
    // Basic information
    // --------------------------------------------------------

    const diagnosis =
        getDiagnosis(record);

    const filename =
        getFilename(record);

    const confidence =
        formatConfidence(record);

    const dateValue =
        getDateValue(record);


    // --------------------------------------------------------
    // Report status
    // --------------------------------------------------------

    if (reportStatus) {

        reportStatus.textContent =
            "Diagnosis Report Ready";
    }


    if (reportDate) {

        reportDate.textContent =
            `Generated: ${formatDate(
                dateValue
            )}`;
    }


    // --------------------------------------------------------
    // Diagnosis
    // --------------------------------------------------------

    if (reportDiagnosis) {

        reportDiagnosis.textContent =
            diagnosis;
    }


    // --------------------------------------------------------
    // Confidence
    // --------------------------------------------------------

    if (reportConfidence) {

        reportConfidence.textContent =
            confidence;
    }


    // --------------------------------------------------------
    // Severity
    // --------------------------------------------------------

    if (reportSeverity) {

        reportSeverity.textContent =
            record?.severity ||
            "Not available";
    }


    // --------------------------------------------------------
    // Severity score
    // --------------------------------------------------------

    if (reportSeverityScore) {

        const score =
            record?.severity_score;

        reportSeverityScore.textContent =
            score !== undefined &&
            score !== null
                ? score
                : "N/A";
    }


    // --------------------------------------------------------
    // Age
    // --------------------------------------------------------

    if (reportAge) {

        reportAge.textContent =
            formatAge(record);
    }


    // --------------------------------------------------------
    // Duration
    // --------------------------------------------------------

    if (reportDuration) {

        reportDuration.textContent =
            formatDuration(record);
    }


    // --------------------------------------------------------
    // Filename
    // --------------------------------------------------------

    if (reportFilename) {

        reportFilename.textContent =
            filename;
    }


    if (reportImageFilename) {

        reportImageFilename.textContent =
            filename;
    }


    // --------------------------------------------------------
    // Diagnosis date
    // --------------------------------------------------------

    if (reportDiagnosisDate) {

        reportDiagnosisDate.textContent =
            formatDate(dateValue);
    }


    // --------------------------------------------------------
    // Symptoms
    // --------------------------------------------------------

    populateSymptoms(
        getSymptoms(record)
    );


    // --------------------------------------------------------
    // Severity factors
    // --------------------------------------------------------

    populateList(
        reportSeverityFactors,
        getSeverityFactors(record),
        "No severity factors available."
    );


    // --------------------------------------------------------
    // Recommendations
    // --------------------------------------------------------

    populateList(
        reportRecommendations,
        getRecommendations(record),
        "No recommendations available."
    );


    // --------------------------------------------------------
    // Precautions
    // --------------------------------------------------------

    populateList(
        reportPrecautions,
        getPrecautions(record),
        "No precautions available."
    );


    // --------------------------------------------------------
    // When to seek care
    // --------------------------------------------------------

    populateList(
        reportSeekCare,
        getSeekCare(record),
        "No additional care guidance available."
    );


    // --------------------------------------------------------
    // Urgency
    // --------------------------------------------------------

    if (reportUrgency) {

        reportUrgency.textContent =
            record?.urgency ||
            "Clinical confirmation recommended.";
    }


    // --------------------------------------------------------
    // Add severity class
    // --------------------------------------------------------

    applySeverityClass(
        record?.severity
    );
}


// ============================================================
// APPLY SEVERITY CLASS
// ============================================================

function applySeverityClass(severity) {

    if (!severity) {
        return;
    }

    const normalized =
        String(severity)
            .toLowerCase()
            .trim();


    if (reportSeverity) {

        reportSeverity.classList.remove(
            "severity-mild",
            "severity-moderate",
            "severity-severe",
            "severity-unknown"
        );


        if (normalized === "mild") {

            reportSeverity.classList.add(
                "severity-mild"
            );

        } else if (
            normalized === "moderate"
        ) {

            reportSeverity.classList.add(
                "severity-moderate"
            );

        } else if (
            normalized === "severe"
        ) {

            reportSeverity.classList.add(
                "severity-severe"
            );

        } else {

            reportSeverity.classList.add(
                "severity-unknown"
            );
        }
    }
}


// ============================================================
// PRINT REPORT
// ============================================================

function printReport() {

    window.print();
}


// ============================================================
// EVENT LISTENERS
// ============================================================

if (printReportButton) {

    printReportButton.addEventListener(
        "click",
        printReport
    );
}


if (printReportButtonBottom) {

    printReportButtonBottom.addEventListener(
        "click",
        printReport
    );
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadReport();

    }
);


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.loadOtitisReport =
    loadReport;

window.printOtitisReport =
    printReport;