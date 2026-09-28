// ============================================================
// OtitisAI-CDSS
// Premium Medical AI Report JavaScript
// ============================================================


const REPORT_STORAGE_KEY =
    "selectedDiagnosisReport";


const API_URL =
    "http://127.0.0.1:8000";


// ============================================================
// DOM ELEMENTS
// ============================================================

const reportStatus =
    document.getElementById(
        "reportStatus"
    );


const reportDate =
    document.getElementById(
        "reportDate"
    );


const reportDiagnosis =
    document.getElementById(
        "reportDiagnosis"
    );


const reportConfidence =
    document.getElementById(
        "reportConfidence"
    );


const reportSeverity =
    document.getElementById(
        "reportSeverity"
    );


const reportSeverityScore =
    document.getElementById(
        "reportSeverityScore"
    );


const reportAge =
    document.getElementById(
        "reportAge"
    );


const reportDuration =
    document.getElementById(
        "reportDuration"
    );


const reportFilename =
    document.getElementById(
        "reportFilename"
    );


const reportDiagnosisDate =
    document.getElementById(
        "reportDiagnosisDate"
    );


const reportImageFilename =
    document.getElementById(
        "reportImageFilename"
    );


const reportSymptoms =
    document.getElementById(
        "reportSymptoms"
    );


const reportSeverityFactors =
    document.getElementById(
        "reportSeverityFactors"
    );


const reportRecommendations =
    document.getElementById(
        "reportRecommendations"
    );


const reportPrecautions =
    document.getElementById(
        "reportPrecautions"
    );


const reportSeekCare =
    document.getElementById(
        "reportSeekCare"
    );


const reportUrgency =
    document.getElementById(
        "reportUrgency"
    );


const gradcamContainer =
    document.getElementById(
        "gradcamContainer"
    );


const printReportButton =
    document.getElementById(
        "printReportButton"
    );


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


        return JSON.parse(
            storedReport
        );

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
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [];
}


// ============================================================
// GET LIST DATA
// ============================================================

function getListData(
    record,
    field
) {

    const value =
        record?.[field];


    if (Array.isArray(value)) {

        return value;

    }


    if (
        typeof value === "string" &&
        value.trim()
    ) {

        return [value];

    }


    return [];
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


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
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
// FORMAT CONFIDENCE
// ============================================================

function formatConfidence(record) {

    let confidence =
        record?.confidence_percentage;


    if (
        confidence !== null &&
        confidence !== undefined &&
        confidence !== ""
    ) {

        const number =
            Number(confidence);


        if (!Number.isNaN(number)) {

            return `${number.toFixed(1)}%`;

        }
    }


    confidence =
        record?.confidence;


    if (
        confidence !== null &&
        confidence !== undefined &&
        confidence !== ""
    ) {

        const number =
            Number(confidence);


        if (!Number.isNaN(number)) {

            if (number <= 1) {

                return `${(
                    number * 100
                ).toFixed(1)}%`;

            }


            return `${number.toFixed(1)}%`;
        }
    }


    return "N/A";
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


    element.innerHTML =
        "";


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


// ============================================================
// POPULATE SYMPTOMS
// ============================================================

function populateSymptoms(
    symptoms
) {

    if (!reportSymptoms) {

        return;

    }


    reportSymptoms.innerHTML =
        "";


    if (
        !Array.isArray(symptoms) ||
        symptoms.length === 0
    ) {

        const empty =
            document.createElement(
                "span"
            );


        empty.className =
            "empty-value";


        empty.textContent =
            "No symptoms provided.";


        reportSymptoms.appendChild(
            empty
        );


        return;
    }


    symptoms.forEach(
        symptom => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "symptom-tag";


            tag.textContent =
                symptom;


            reportSymptoms.appendChild(
                tag
            );

        }
    );
}


// ============================================================
// GRAD-CAM
// ============================================================

function displayGradCAM(
    record
) {

    if (!gradcamContainer) {

        return;

    }


    gradcamContainer.innerHTML =
        "";


    const gradcamPath =
        record?.gradcam_image;


    const gradcamAvailable =
        record?.gradcam_available === true;


    if (
        !gradcamAvailable ||
        !gradcamPath
    ) {

        gradcamContainer.innerHTML = `

            <div class="gradcam-placeholder">

                <div class="placeholder-icon">
                    🧠
                </div>

                <strong>
                    Grad-CAM Unavailable
                </strong>

                <p>
                    Explainable AI visualization
                    was not generated for this report.
                </p>

            </div>

        `;

        return;
    }


    const imageUrl =
        `${API_URL}${gradcamPath}`;


    gradcamContainer.innerHTML = `

        <img
            src="${imageUrl}?t=${Date.now()}"
            alt="Grad-CAM explanation heatmap"
            class="gradcam-image"
        >

    `;
}


// ============================================================
// APPLY SEVERITY CLASS
// ============================================================

function applySeverityClass(
    severity
) {

    if (!reportSeverity) {

        return;

    }


    reportSeverity.classList.remove(
        "severity-mild",
        "severity-moderate",
        "severity-severe",
        "severity-unknown"
    );


    if (!severity) {

        reportSeverity.classList.add(
            "severity-unknown"
        );

        return;
    }


    const normalized =
        String(severity)
            .toLowerCase()
            .trim();


    if (
        normalized === "mild"
    ) {

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


// ============================================================
// LOAD REPORT
// ============================================================

function loadReport() {

    const record =
        getSelectedReport();


    // --------------------------------------------------------
    // NO REPORT
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


        displayGradCAM(
            {}
        );


        return;
    }


    // --------------------------------------------------------
    // BASIC VALUES
    // --------------------------------------------------------

    const diagnosis =
        getDiagnosis(record);


    const filename =
        getFilename(record);


    const confidence =
        formatConfidence(record);


    const dateValue =
        getDateValue(record);


    const severity =
        record?.severity ||
        "Not available";


    const severityScore =
        record?.severity_score;


    // --------------------------------------------------------
    // STATUS
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
    // DIAGNOSIS
    // --------------------------------------------------------

    if (reportDiagnosis) {

        reportDiagnosis.textContent =
            diagnosis;

    }


    // --------------------------------------------------------
    // CONFIDENCE
    // --------------------------------------------------------

    if (reportConfidence) {

        reportConfidence.textContent =
            confidence;

    }


    // --------------------------------------------------------
    // SEVERITY
    // --------------------------------------------------------

    if (reportSeverity) {

        reportSeverity.textContent =
            severity;

    }


    // --------------------------------------------------------
    // SEVERITY SCORE
    // --------------------------------------------------------

    if (reportSeverityScore) {

        reportSeverityScore.textContent =
            severityScore !== undefined &&
            severityScore !== null
                ? severityScore
                : "N/A";

    }


    // --------------------------------------------------------
    // PATIENT
    // --------------------------------------------------------

    if (reportAge) {

        reportAge.textContent =
            formatAge(record);

    }


    if (reportDuration) {

        reportDuration.textContent =
            formatDuration(record);

    }


    if (reportFilename) {

        reportFilename.textContent =
            filename;

    }


    if (reportDiagnosisDate) {

        reportDiagnosisDate.textContent =
            formatDate(dateValue);

    }


    if (reportImageFilename) {

        reportImageFilename.textContent =
            filename;

    }


    // --------------------------------------------------------
    // SYMPTOMS
    // --------------------------------------------------------

    populateSymptoms(
        getSymptoms(record)
    );


    // --------------------------------------------------------
    // SEVERITY FACTORS
    // --------------------------------------------------------

    populateList(
        reportSeverityFactors,
        getListData(
            record,
            "severity_factors"
        ),
        "No severity factors available."
    );


    // --------------------------------------------------------
    // RECOMMENDATIONS
    // --------------------------------------------------------

    populateList(
        reportRecommendations,
        getListData(
            record,
            "recommendations"
        ),
        "No recommendations available."
    );


    // --------------------------------------------------------
    // PRECAUTIONS
    // --------------------------------------------------------

    populateList(
        reportPrecautions,
        getListData(
            record,
            "precautions"
        ),
        "No precautions available."
    );


    // --------------------------------------------------------
    // SEEK CARE
    // --------------------------------------------------------

    populateList(
        reportSeekCare,
        getListData(
            record,
            "when_to_seek_care"
        ),
        "No additional care guidance available."
    );


    // --------------------------------------------------------
    // URGENCY
    // --------------------------------------------------------

    if (reportUrgency) {

        reportUrgency.textContent =
            record?.urgency ||
            "Clinical confirmation recommended.";

    }


    // --------------------------------------------------------
    // SEVERITY STYLE
    // --------------------------------------------------------

    applySeverityClass(
        severity
    );


    // --------------------------------------------------------
    // GRAD-CAM
    // --------------------------------------------------------

    displayGradCAM(
        record
    );
}


// ============================================================
// PRINT
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