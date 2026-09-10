/* ============================================================
   OtitisAI-CDSS
   Diagnosis Report JavaScript
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeReport();
});


/* ============================================================
   INITIALIZE REPORT
   ============================================================ */

function initializeReport() {

    const reportContent = document.getElementById("reportContent");
    const noReportMessage = document.getElementById("noReportMessage");

    const reportData = getReportData();

    if (!reportData) {

        if (reportContent) {
            reportContent.classList.add("hidden");
        }

        if (noReportMessage) {
            noReportMessage.classList.remove("hidden");
        }

        setupButtons(null);

        return;
    }

    if (noReportMessage) {
        noReportMessage.classList.add("hidden");
    }

    if (reportContent) {
        reportContent.classList.remove("hidden");
    }

    displayReport(reportData);
    setupButtons(reportData);
}


/* ============================================================
   GET REPORT DATA
   ============================================================ */

function getReportData() {

    /*
     * dashboard.js stores the selected diagnosis here.
     */

    const storedReport =
        sessionStorage.getItem("selectedDiagnosisReport");

    if (storedReport) {

        try {
            return JSON.parse(storedReport);
        } catch (error) {

            console.error(
                "Unable to read selected report:",
                error
            );
        }
    }


    /*
     * If there is no selected report, use the most
     * recent diagnosis from localStorage.
     */

    const history =
        JSON.parse(
            localStorage.getItem("otitisDiagnosisHistory") || "[]"
        );

    if (Array.isArray(history) && history.length > 0) {
        return history[0];
    }

    return null;
}


/* ============================================================
   DISPLAY REPORT
   ============================================================ */

function displayReport(data) {

    const prediction =
        data.prediction || data.diagnosis || "Unknown";

    const confidence =
        Number(
            data.confidence_percentage ??
            (
                Number(data.confidence || 0) * 100
            )
        );

    const symptoms =
        normalizeArray(data.symptoms);

    const recommendations =
        normalizeArray(data.recommendations);

    const precautions =
        normalizeArray(data.precautions);

    const seekCare =
        normalizeArray(
            data.when_to_seek_care ||
            data.seekCare ||
            data.whenToSeekCare
        );


    // -----------------------------
    // Basic information
    // -----------------------------

    setText(
        "reportDate",
        formatDate(
            data.date ||
            data.timestamp ||
            data.created_at
        )
    );

    setText(
        "reportFilename",
        data.filename || "Not available"
    );

    setText(
        "reportAge",
        data.age
            ? `${data.age} years`
            : "Not provided"
    );

    setText(
        "reportDuration",
        formatDuration(data.duration)
    );


    // -----------------------------
    // Diagnosis
    // -----------------------------

    setText(
        "reportDiagnosis",
        prediction
    );


    // -----------------------------
    // Confidence
    // -----------------------------

    displayConfidence(confidence);


    // -----------------------------
    // Symptoms
    // -----------------------------

    displaySymptoms(symptoms);


    // -----------------------------
    // Recommendations
    // -----------------------------

    displayList(
        "reportRecommendations",
        recommendations,
        "No recommendations available."
    );


    // -----------------------------
    // Precautions
    // -----------------------------

    displayList(
        "reportPrecautions",
        precautions,
        "No precautions available."
    );


    // -----------------------------
    // Seek medical care
    // -----------------------------

    displayList(
        "reportSeekCare",
        seekCare,
        "Consult a qualified healthcare professional if symptoms persist or worsen."
    );


    // -----------------------------
    // Urgency
    // -----------------------------

    displayUrgency(
        data.urgency || "Routine"
    );


    // -----------------------------
    // Generated time
    // -----------------------------

    setText(
        "generatedTime",
        formatDateTime(new Date())
    );
}


/* ============================================================
   CONFIDENCE
   ============================================================ */

function displayConfidence(confidence) {

    let value = Number(confidence);

    if (!Number.isFinite(value)) {
        value = 0;
    }

    value = Math.max(0, Math.min(100, value));

    const confidenceText =
        `${value.toFixed(1)}%`;

    setText(
        "reportConfidence",
        confidenceText
    );


    const progress =
        document.getElementById(
            "confidenceProgress"
        );

    if (progress) {
        progress.style.width = `${value}%`;
    }


    const message =
        document.getElementById(
            "confidenceMessage"
        );

    if (!message) {
        return;
    }


    if (value >= 80) {

        message.textContent =
            "High model confidence. The result should still be reviewed with clinical findings.";

    } else if (value >= 60) {

        message.textContent =
            "Moderate model confidence. Clinical assessment is recommended before making decisions.";

    } else {

        message.textContent =
            "Low model confidence. The result should be treated cautiously and reviewed by a healthcare professional.";
    }
}


/* ============================================================
   SYMPTOMS
   ============================================================ */

function displaySymptoms(symptoms) {

    const container =
        document.getElementById(
            "reportSymptoms"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    if (!symptoms || symptoms.length === 0) {

        const empty =
            document.createElement("span");

        empty.className = "symptom-tag empty";

        empty.textContent =
            "No symptoms reported";

        container.appendChild(empty);

        return;
    }


    symptoms.forEach((symptom) => {

        const tag =
            document.createElement("span");

        tag.className = "symptom-tag";

        tag.textContent =
            formatSymptom(symptom);

        container.appendChild(tag);
    });
}


/* ============================================================
   LIST DISPLAY
   ============================================================ */

function displayList(
    elementId,
    items,
    emptyMessage
) {

    const list =
        document.getElementById(elementId);

    if (!list) {
        return;
    }

    list.innerHTML = "";


    if (!items || items.length === 0) {

        const li =
            document.createElement("li");

        li.textContent =
            emptyMessage;

        list.appendChild(li);

        return;
    }


    items.forEach((item) => {

        const li =
            document.createElement("li");

        li.textContent =
            formatText(item);

        list.appendChild(li);
    });
}


/* ============================================================
   URGENCY
   ============================================================ */

function displayUrgency(urgency) {

    const element =
        document.getElementById(
            "reportUrgency"
        );

    if (!element) {
        return;
    }


    const value =
        String(urgency || "Routine");


    element.textContent =
        formatUrgency(value);


    element.className =
        "urgency-value " +
        getUrgencyClass(value);
}


function getUrgencyClass(value) {

    const normalized =
        String(value)
            .toLowerCase()
            .trim();


    if (
        normalized.includes("urgent") ||
        normalized.includes("high") ||
        normalized.includes("immediate")
    ) {
        return "urgent";
    }


    if (
        normalized.includes("moderate") ||
        normalized.includes("soon")
    ) {
        return "moderate";
    }


    return "routine";
}


function formatUrgency(value) {

    const normalized =
        String(value)
            .replace(/_/g, " ")
            .trim();


    return normalized.charAt(0).toUpperCase() +
        normalized.slice(1);
}


/* ============================================================
   PRINT REPORT
   ============================================================ */

function printReport() {

    window.print();
}


/* ============================================================
   PDF DOWNLOAD
   ============================================================ */

function downloadPDF() {

    /*
     * Browser print dialog provides a reliable PDF option
     * without requiring another JavaScript library.
     */

    window.print();
}


/* ============================================================
   BUTTONS
   ============================================================ */

function setupButtons(data) {

    const printButton =
        document.getElementById(
            "printButton"
        );

    const downloadButton =
        document.getElementById(
            "downloadButton"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                if (!data) {
                    alert(
                        "There is no diagnosis report to print."
                    );

                    return;
                }

                printReport();
            }
        );
    }


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            () => {

                if (!data) {
                    alert(
                        "There is no diagnosis report to download."
                    );

                    return;
                }

                downloadPDF();
            }
        );
    }
}


/* ============================================================
   ARRAY NORMALIZATION
   ============================================================ */

function normalizeArray(value) {

    if (Array.isArray(value)) {

        return value
            .filter(
                item =>
                    item !== null &&
                    item !== undefined &&
                    String(item).trim() !== ""
            )
            .map(item => String(item).trim());
    }


    if (typeof value === "string") {

        return value
            .split(/\n|,/)
            .map(item => item.trim())
            .filter(Boolean);
    }


    return [];
}


/* ============================================================
   FORMAT SYMPTOMS
   ============================================================ */

function formatSymptom(symptom) {

    return String(symptom)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


/* ============================================================
   FORMAT DURATION
   ============================================================ */

function formatDuration(duration) {

    if (!duration) {
        return "Not provided";
    }


    const values = {

        "less_than_1_week":
            "Less than 1 week",

        "1_4_weeks":
            "1–4 weeks",

        "more_than_1_month":
            "More than 1 month"
    };


    return (
        values[duration] ||
        formatSymptom(duration)
    );
}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {

    if (!value) {
        return "Not available";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return String(value);
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ============================================================
   FORMAT DATETIME
   ============================================================ */

function formatDateTime(date) {

    return new Date(date).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ============================================================
   FORMAT GENERAL TEXT
   ============================================================ */

function formatText(value) {

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


/* ============================================================
   SET TEXT SAFELY
   ============================================================ */

function setText(elementId, value) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined ||
        value === ""
            ? "—"
            : String(value);
}