/* ============================================================
   OtitisAI-CDSS
   Complete Diagnosis Report JavaScript
   ============================================================ */

"use strict";


/* ============================================================
   CONSTANTS
   ============================================================ */

const HISTORY_KEY = "otitisDiagnosisHistory";
const SELECTED_REPORT_KEY = "selectedDiagnosisReport";


/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    initializeReport();

});


/* ============================================================
   INITIALIZE REPORT
   ============================================================ */

function initializeReport() {

    console.log("OtitisAI-CDSS Report Page Loaded");

    const reportData = getReportData();

    console.log("Report data:", reportData);


    if (!reportData) {

        showNoReportMessage();

        setupReportButtons(null);

        return;
    }


    hideNoReportMessage();

    createReportContainerIfNeeded();

    displayReport(reportData);

    setupReportButtons(reportData);

}


/* ============================================================
   GET REPORT DATA
   ============================================================ */

function getReportData() {

    /*
     * Priority 1:
     * Selected report from Dashboard
     */

    try {

        const selectedReport =
            sessionStorage.getItem(
                SELECTED_REPORT_KEY
            );

        if (selectedReport) {

            const parsed =
                JSON.parse(selectedReport);

            if (parsed) {

                console.log(
                    "Using selected diagnosis report."
                );

                return parsed;

            }
        }

    } catch (error) {

        console.error(
            "Error reading selected report:",
            error
        );

    }


    /*
     * Priority 2:
     * Most recent diagnosis from localStorage
     */

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    HISTORY_KEY
                ) || "[]"
            );


        if (
            Array.isArray(history) &&
            history.length > 0
        ) {

            console.log(
                "Using latest diagnosis from history."
            );

            return history[0];

        }

    } catch (error) {

        console.error(
            "Error reading diagnosis history:",
            error
        );

    }


    return null;

}


/* ============================================================
   CREATE REPORT CONTAINER
   ============================================================ */

function createReportContainerIfNeeded() {

    let reportContent =
        document.getElementById(
            "reportContent"
        );


    if (reportContent) {

        reportContent.classList.remove("hidden");

        return;

    }


    /*
     * Find main page container.
     */

    let main =
        document.querySelector("main");


    if (!main) {

        main =
            document.querySelector(
                ".report-page"
            );

    }


    if (!main) {

        main =
            document.body;

    }


    /*
     * Create report container.
     */

    reportContent =
        document.createElement("div");

    reportContent.id =
        "reportContent";

    reportContent.className =
        "report-content";


    /*
     * Insert after the page header if possible.
     */

    const pageHeader =
        document.querySelector(
            ".report-header"
        );


    if (
        pageHeader &&
        pageHeader.parentNode
    ) {

        pageHeader.parentNode.insertBefore(
            reportContent,
            pageHeader.nextSibling
        );

    }

    else {

        main.appendChild(
            reportContent
        );

    }


    console.log(
        "Report content container created."
    );

}


/* ============================================================
   DISPLAY REPORT
   ============================================================ */

function displayReport(data) {

    const prediction =
        data.prediction ||
        data.diagnosis ||
        data.predicted_class ||
        "Unknown";


    /*
     * Confidence
     */

    let confidence = null;


    if (
        data.confidence_percentage !== null &&
        data.confidence_percentage !== undefined
    ) {

        confidence =
            Number(
                data.confidence_percentage
            );

    }

    else if (
        data.confidence !== null &&
        data.confidence !== undefined
    ) {

        confidence =
            Number(data.confidence);

        /*
         * Backend usually returns confidence
         * between 0 and 1.
         */

        if (
            confidence >= 0 &&
            confidence <= 1
        ) {

            confidence =
                confidence * 100;

        }

    }


    if (!Number.isFinite(confidence)) {

        confidence = 0;

    }


    confidence =
        Math.max(
            0,
            Math.min(
                100,
                confidence
            )
        );


    /*
     * Other information
     */

    const filename =
        data.filename ||
        "Uploaded otoscopic image";


    const age =
        data.age ||
        "Not provided";


    const duration =
        data.duration ||
        "Not provided";


    const symptoms =
        normalizeArray(
            data.symptoms
        );


    const recommendations =
        normalizeArray(
            data.recommendations
        );


    const precautions =
        normalizeArray(
            data.precautions
        );


    const seekCare =
        normalizeArray(
            data.when_to_seek_care ||
            data.seekCare ||
            data.whenToSeekCare
        );


    const urgency =
        data.urgency ||
        "Clinical review recommended";


    const reportDate =
        data.date ||
        data.timestamp ||
        data.created_at ||
        new Date();


    /*
     * Build complete report.
     */

    const reportHTML = `

        <div class="generated-report">

            <!-- =========================================
                 REPORT HEADER
                 ========================================= -->

            <div class="report-card report-summary">

                <div class="report-card-header">

                    <div>
                        <span class="report-label">
                            DIAGNOSIS RESULT
                        </span>

                        <h2>
                            ${escapeHTML(prediction)}
                        </h2>
                    </div>

                    <div class="report-status">
                        AI Analysis
                    </div>

                </div>


                <div class="report-main-result">

                    <div class="diagnosis-box">

                        <span class="small-label">
                            Diagnosis
                        </span>

                        <strong>
                            ${escapeHTML(prediction)}
                        </strong>

                    </div>


                    <div class="confidence-box">

                        <span class="small-label">
                            Confidence
                        </span>

                        <strong>
                            ${confidence.toFixed(1)}%
                        </strong>

                        <div class="confidence-bar">

                            <div
                                class="confidence-progress"
                                style="width:${confidence}%"
                            ></div>

                        </div>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 PATIENT / IMAGE INFORMATION
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    Patient & Examination Information
                </div>


                <div class="report-grid">

                    <div class="report-field">

                        <span>
                            Image
                        </span>

                        <strong>
                            ${escapeHTML(filename)}
                        </strong>

                    </div>


                    <div class="report-field">

                        <span>
                            Age
                        </span>

                        <strong>
                            ${escapeHTML(String(age))}
                            ${
                                age !== "Not provided"
                                    ? " years"
                                    : ""
                            }
                        </strong>

                    </div>


                    <div class="report-field">

                        <span>
                            Symptom Duration
                        </span>

                        <strong>
                            ${escapeHTML(
                                formatDuration(duration)
                            )}
                        </strong>

                    </div>


                    <div class="report-field">

                        <span>
                            Report Date
                        </span>

                        <strong>
                            ${escapeHTML(
                                formatDate(reportDate)
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 SYMPTOMS
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    Clinical Symptoms
                </div>


                <div class="symptoms-container">

                    ${
                        symptoms.length > 0
                            ? symptoms.map(
                                symptom =>
                                    `
                                    <span class="symptom-tag">
                                        ${escapeHTML(
                                            formatSymptom(symptom)
                                        )}
                                    </span>
                                    `
                            ).join("")
                            :
                            `
                            <span class="empty-message">
                                No symptoms reported.
                            </span>
                            `
                    }

                </div>

            </div>


            <!-- =========================================
                 IMAGE / CLINICAL INFORMATION
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    Multimodal Analysis
                </div>


                <div class="analysis-grid">

                    <div class="analysis-item">

                        <span>
                            Image Analysis
                        </span>

                        <strong>
                            ${
                                data.image_prediction ||
                                prediction
                            }
                        </strong>

                    </div>


                    <div class="analysis-item">

                        <span>
                            Image Confidence
                        </span>

                        <strong>
                            ${
                                data.image_confidence !==
                                undefined &&
                                data.image_confidence !== null
                                    ?
                                    formatConfidence(
                                        data.image_confidence
                                    )
                                    :
                                    "N/A"
                            }
                        </strong>

                    </div>


                    <div class="analysis-item">

                        <span>
                            Clinical Data
                        </span>

                        <strong>
                            ${
                                symptoms.length > 0
                                    ? "Included"
                                    : "Not provided"
                            }
                        </strong>

                    </div>


                    <div class="analysis-item">

                        <span>
                            Analysis Type
                        </span>

                        <strong>
                            Image + Clinical Data
                        </strong>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 RECOMMENDATIONS
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    Clinical Recommendations
                </div>


                ${
                    createListHTML(
                        recommendations,
                        "No specific recommendations available."
                    )
                }

            </div>


            <!-- =========================================
                 PRECAUTIONS
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    Precautions
                </div>


                ${
                    createListHTML(
                        precautions,
                        "No specific precautions available."
                    )
                }

            </div>


            <!-- =========================================
                 WHEN TO SEEK CARE
                 ========================================= -->

            <div class="report-card">

                <div class="report-card-title">
                    When to Seek Medical Care
                </div>


                ${
                    createListHTML(
                        seekCare,
                        "Consult a qualified healthcare professional if symptoms persist or worsen."
                    )
                }

            </div>


            <!-- =========================================
                 URGENCY
                 ========================================= -->

            <div class="report-card urgency-card">

                <div class="report-card-title">
                    Clinical Review Status
                </div>


                <div class="
                    urgency-value
                    ${getUrgencyClass(urgency)}
                ">

                    ${escapeHTML(
                        formatUrgency(urgency)
                    )}

                </div>


                <p class="report-disclaimer">

                    This AI-generated result is intended
                    for educational and clinical decision-support
                    purposes and should not replace assessment
                    by a qualified healthcare professional.

                </p>

            </div>


            <!-- =========================================
                 REPORT FOOTER
                 ========================================= -->

            <div class="report-generated">

                Report generated by
                <strong>
                    OtitisAI-CDSS
                </strong>

                <br>

                ${escapeHTML(
                    formatDateTime(new Date())
                )}

            </div>

        </div>

    `;


    /*
     * Put HTML into report container.
     */

    const reportContent =
        document.getElementById(
            "reportContent"
        );


    if (reportContent) {

        reportContent.innerHTML =
            reportHTML;

        reportContent.classList.remove(
            "hidden"
        );

    }


    /*
     * Also update existing elements if your
     * report.html already contains them.
     */

    setText(
        "reportDiagnosis",
        prediction
    );


    setText(
        "reportConfidence",
        `${confidence.toFixed(1)}%`
    );


    setText(
        "reportFilename",
        filename
    );


    setText(
        "reportAge",
        age === "Not provided"
            ? "Not provided"
            : `${age} years`
    );


    setText(
        "reportDuration",
        formatDuration(duration)
    );


    setText(
        "reportDate",
        formatDate(reportDate)
    );


    setText(
        "reportUrgency",
        formatUrgency(urgency)
    );


    setText(
        "generatedTime",
        formatDateTime(new Date())
    );


    /*
     * Existing confidence progress bar.
     */

    const progress =
        document.getElementById(
            "confidenceProgress"
        );


    if (progress) {

        progress.style.width =
            `${confidence}%`;

    }


    /*
     * Existing symptom container.
     */

    displayExistingSymptoms(
        symptoms
    );


    /*
     * Existing list elements.
     */

    displayExistingList(
        "reportRecommendations",
        recommendations,
        "No specific recommendations available."
    );


    displayExistingList(
        "reportPrecautions",
        precautions,
        "No specific precautions available."
    );


    displayExistingList(
        "reportSeekCare",
        seekCare,
        "Consult a qualified healthcare professional if symptoms persist or worsen."
    );


    console.log(
        "Diagnosis report displayed successfully."
    );

}


/* ============================================================
   CREATE LIST HTML
   ============================================================ */

function createListHTML(
    items,
    emptyMessage
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return `
            <p class="empty-message">
                ${escapeHTML(emptyMessage)}
            </p>
        `;

    }


    return `

        <ul class="report-list">

            ${items.map(
                item =>
                    `
                    <li>
                        ${escapeHTML(
                            formatText(item)
                        )}
                    </li>
                    `
            ).join("")}

        </ul>

    `;

}


/* ============================================================
   EXISTING SYMPTOM DISPLAY
   ============================================================ */

function displayExistingSymptoms(
    symptoms
) {

    const container =
        document.getElementById(
            "reportSymptoms"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        !symptoms ||
        symptoms.length === 0
    ) {

        const empty =
            document.createElement(
                "span"
            );

        empty.className =
            "symptom-tag empty";

        empty.textContent =
            "No symptoms reported";

        container.appendChild(
            empty
        );

        return;

    }


    symptoms.forEach(
        function (symptom) {

            const tag =
                document.createElement(
                    "span"
                );

            tag.className =
                "symptom-tag";

            tag.textContent =
                formatSymptom(
                    symptom
                );

            container.appendChild(
                tag
            );

        }
    );

}


/* ============================================================
   EXISTING LIST DISPLAY
   ============================================================ */

function displayExistingList(
    elementId,
    items,
    emptyMessage
) {

    const list =
        document.getElementById(
            elementId
        );


    if (!list) {

        return;

    }


    list.innerHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );

        li.textContent =
            emptyMessage;

        list.appendChild(
            li
        );

        return;

    }


    items.forEach(
        function (item) {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                formatText(item);

            list.appendChild(
                li
            );

        }
    );

}


/* ============================================================
   BUTTON SETUP
   ============================================================ */

function setupReportButtons(
    reportData
) {

    const printButton =
        document.getElementById(
            "printButton"
        );


    const downloadButton =
        document.getElementById(
            "downloadButton"
        );


    /*
     * PRINT
     */

    if (printButton) {

        printButton.onclick =
            function () {

                if (!reportData) {

                    alert(
                        "There is no diagnosis report available."
                    );

                    return;

                }


                printReport();

            };

    }


    /*
     * DOWNLOAD PDF
     */

    if (downloadButton) {

        downloadButton.onclick =
            function () {

                if (!reportData) {

                    alert(
                        "There is no diagnosis report available."
                    );

                    return;

                }


                downloadPDF();

            };

    }

}


/* ============================================================
   PRINT REPORT
   ============================================================ */

function printReport() {

    window.print();

}


/* ============================================================
   DOWNLOAD PDF
   ============================================================ */

function downloadPDF() {

    /*
     * Browser print dialog allows the user to select:
     *
     * Microsoft Print to PDF
     * Save as PDF
     *
     * This does not require jsPDF or another library.
     */

    window.print();

}


/* ============================================================
   NO REPORT MESSAGE
   ============================================================ */

function showNoReportMessage() {

    const existing =
        document.getElementById(
            "noReportMessage"
        );


    if (existing) {

        existing.classList.remove(
            "hidden"
        );

        existing.style.display =
            "block";

        return;

    }


    /*
     * Create message if it doesn't exist.
     */

    const message =
        document.createElement(
            "div"
        );


    message.id =
        "noReportMessage";


    message.className =
        "no-report-message";


    message.innerHTML = `

        <div class="no-report-box">

            <h2>
                No Diagnosis Report Available
            </h2>

            <p>
                Please complete an AI diagnosis first.
            </p>

            <a
                href="app.html"
                class="report-action-link"
            >
                Go to AI Diagnosis
            </a>

        </div>

    `;


    const main =
        document.querySelector(
            "main"
        ) || document.body;


    main.appendChild(
        message
    );

}


/* ============================================================
   HIDE NO REPORT MESSAGE
   ============================================================ */

function hideNoReportMessage() {

    const element =
        document.getElementById(
            "noReportMessage"
        );


    if (!element) {

        return;

    }


    element.classList.add(
        "hidden"
    );


    element.style.display =
        "none";

}


/* ============================================================
   NORMALIZE ARRAY
   ============================================================ */

function normalizeArray(
    value
) {

    if (Array.isArray(value)) {

        return value
            .filter(
                function (item) {

                    return (
                        item !== null &&
                        item !== undefined &&
                        String(item).trim() !== ""
                    );

                }
            )
            .map(
                function (item) {

                    return String(
                        item
                    ).trim();

                }
            );

    }


    if (typeof value === "string") {

        return value
            .split(/\n|,/)
            .map(
                function (item) {

                    return item.trim();

                }
            )
            .filter(Boolean);

    }


    return [];

}


/* ============================================================
   FORMAT SYMPTOM
   ============================================================ */

function formatSymptom(
    symptom
) {

    return String(symptom)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* ============================================================
   FORMAT DURATION
   ============================================================ */

function formatDuration(
    duration
) {

    if (
        duration === null ||
        duration === undefined ||
        duration === ""
    ) {

        return "Not provided";

    }


    const value =
        String(duration)
            .toLowerCase()
            .trim();


    const values = {

        "less_than_1_week":
            "Less than 1 week",

        "1_4_weeks":
            "1–4 weeks",

        "more_than_1_month":
            "More than 1 month",

        "less than 1 week":
            "Less than 1 week",

        "1-4 weeks":
            "1–4 weeks",

        "1 to 4 weeks":
            "1–4 weeks",

        "more than 1 month":
            "More than 1 month"

    };


    if (values[value]) {

        return values[value];

    }


    return formatSymptom(
        duration
    );

}


/* ============================================================
   FORMAT CONFIDENCE
   ============================================================ */

function formatConfidence(
    confidence
) {

    let value =
        Number(confidence);


    if (!Number.isFinite(value)) {

        return "N/A";

    }


    /*
     * Convert 0–1 to percentage.
     */

    if (
        value >= 0 &&
        value <= 1
    ) {

        value =
            value * 100;

    }


    value =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );


    return (
        value.toFixed(1) +
        "%"
    );

}


/* ============================================================
   FORMAT URGENCY
   ============================================================ */

function formatUrgency(
    value
) {

    const text =
        String(
            value ||
            "Clinical review recommended"
        )
        .replace(
            /_/g,
            " "
        )
        .trim();


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* ============================================================
   URGENCY CLASS
   ============================================================ */

function getUrgencyClass(
    value
) {

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


/* ============================================================
   FORMAT TEXT
   ============================================================ */

function formatText(
    value
) {

    return String(value)
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(
    value
) {

    if (!value) {

        return "Not available";

    }


    /*
     * If already formatted text,
     * don't destroy it.
     */

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

function formatDateTime(
    value
) {

    return new Date(
        value
    ).toLocaleString(
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
   ESCAPE HTML
   ============================================================ */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   SET TEXT SAFELY
   ============================================================ */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        (
            value === null ||
            value === undefined ||
            value === ""
        )
            ? "—"
            : String(value);

}


/* ============================================================
   EXPORT FUNCTIONS
   ============================================================ */

window.printReport =
    printReport;


window.downloadPDF =
    downloadPDF;


window.getReportData =
    getReportData;