// =========================================================
// OtitisAI-CDSS — Doctor Dashboard JavaScript
// =========================================================
// Reads diagnosis history saved by app.js in localStorage.
// Compatible with the /api/predict response structure.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const HISTORY_KEY = "otitisDiagnosisHistory";


    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const totalDiagnoses =
        document.getElementById("totalDiagnoses");

    const averageConfidence =
        document.getElementById("averageConfidence");

    const commonDiagnosis =
        document.getElementById("commonDiagnosis");

    const lowConfidenceCount =
        document.getElementById("lowConfidenceCount");

    const searchInput =
        document.getElementById("searchInput");

    const refreshButton =
        document.getElementById("refreshButton");

    const clearHistoryButton =
        document.getElementById("clearHistoryButton");

    const diagnosisTableBody =
        document.getElementById("diagnosisTableBody");

    const emptyState =
        document.getElementById("emptyState");

    const noSearchResults =
        document.getElementById("noSearchResults");

    const detailsSection =
        document.getElementById("detailsSection");

    const closeDetailsButton =
        document.getElementById("closeDetailsButton");

    const detailDiagnosis =
        document.getElementById("detailDiagnosis");

    const detailConfidence =
        document.getElementById("detailConfidence");

    const detailDate =
        document.getElementById("detailDate");

    const detailAge =
        document.getElementById("detailAge");

    const detailDuration =
        document.getElementById("detailDuration");

    const detailFilename =
        document.getElementById("detailFilename");

    const detailSymptoms =
        document.getElementById("detailSymptoms");

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


    // =====================================================
    // LOCAL STORAGE
    // =====================================================

    function getHistory() {

        try {

            const storedHistory =
                localStorage.getItem(HISTORY_KEY);

            if (!storedHistory) {
                return [];
            }

            const parsedHistory =
                JSON.parse(storedHistory);

            if (!Array.isArray(parsedHistory)) {
                return [];
            }

            return parsedHistory;

        } catch (error) {

            console.error(
                "Unable to read diagnosis history:",
                error
            );

            return [];
        }
    }


    function saveHistory(history) {

        try {

            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(history)
            );

        } catch (error) {

            console.error(
                "Unable to save diagnosis history:",
                error
            );

        }
    }


    // =====================================================
    // HTML SAFETY
    // =====================================================

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


    // =====================================================
    // DIAGNOSIS
    // =====================================================

    function getDiagnosis(item) {

        return (
            item.prediction ||
            item.diagnosis ||
            item.predicted_class ||
            item.class_name ||
            "Unknown"
        );
    }


    // =====================================================
    // FILENAME
    // =====================================================

    function getFilename(item) {

        return (
            item.filename ||
            item.file_name ||
            "Uploaded image"
        );
    }


    // =====================================================
    // SYMPTOMS
    // =====================================================

    function getSymptoms(item) {

        if (Array.isArray(item.symptoms)) {

            return item.symptoms
                .filter(Boolean)
                .map(symptom => String(symptom));

        }


        if (typeof item.symptoms === "string") {

            if (!item.symptoms.trim()) {
                return [];
            }

            return item.symptoms
                .split(",")
                .map(symptom => symptom.trim())
                .filter(Boolean);

        }

        return [];
    }


    // =====================================================
    // RECOMMENDATIONS
    // =====================================================

    function getRecommendations(item) {

        if (Array.isArray(item.recommendations)) {

            return item.recommendations
                .filter(Boolean)
                .map(item => String(item));

        }

        if (
            typeof item.recommendations === "string" &&
            item.recommendations.trim()
        ) {

            return [item.recommendations];

        }

        return [];
    }


    // =====================================================
    // PRECAUTIONS
    // =====================================================

    function getPrecautions(item) {

        if (Array.isArray(item.precautions)) {

            return item.precautions
                .filter(Boolean)
                .map(item => String(item));

        }

        if (
            typeof item.precautions === "string" &&
            item.precautions.trim()
        ) {

            return [item.precautions];

        }

        return [];
    }


    // =====================================================
    // WHEN TO SEEK CARE
    // =====================================================

    function getSeekCare(item) {

        if (
            Array.isArray(item.when_to_seek_care)
        ) {

            return item.when_to_seek_care
                .filter(Boolean)
                .map(item => String(item));

        }

        if (
            typeof item.when_to_seek_care === "string" &&
            item.when_to_seek_care.trim()
        ) {

            return [item.when_to_seek_care];

        }

        return [];
    }


    // =====================================================
    // CONFIDENCE
    // =====================================================

    function getConfidenceNumber(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return 0;
        }

        let confidence =
            Number(value);

        if (Number.isNaN(confidence)) {
            return 0;
        }

        /*
         Backend can return:

         confidence = 1
         confidence_percentage = 100

         OR

         confidence = 0.85
         confidence_percentage = 85

         OR sometimes confidence may already be 85.
        */

        if (confidence > 0 && confidence <= 1) {

            confidence *= 100;

        }

        return Math.max(
            0,
            Math.min(
                confidence,
                100
            )
        );
    }


    function getConfidence(item) {

        if (
            item.confidence_percentage !== null &&
            item.confidence_percentage !== undefined &&
            item.confidence_percentage !== ""
        ) {

            return getConfidenceNumber(
                item.confidence_percentage
            );

        }

        return getConfidenceNumber(
            item.confidence
        );
    }


    function formatConfidence(value) {

        const confidence =
            getConfidenceNumber(value);

        if (confidence === 0) {
            return "0%";
        }

        return `${confidence.toFixed(1)}%`;
    }


    // =====================================================
    // CONFIDENCE BADGE
    // =====================================================

    function getConfidenceBadge(value) {

        const confidence =
            getConfidenceNumber(value);


        let badgeClass =
            "badge-danger";


        if (confidence >= 80) {

            badgeClass =
                "badge-success";

        } else if (confidence >= 60) {

            badgeClass =
                "badge-warning";

        }


        return `
            <span class="badge ${badgeClass}">
                ${confidence.toFixed(1)}%
            </span>
        `;
    }


    // =====================================================
    // DATE
    // =====================================================

    function getDateValue(item) {

        return (
            item.timestamp ||
            item.created_at ||
            item.date ||
            null
        );
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "Unknown";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {

            return String(dateValue);

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


    // =====================================================
    // DURATION
    // =====================================================

    function formatDuration(duration) {

        if (
            duration === null ||
            duration === undefined ||
            duration === ""
        ) {

            return "Not specified";

        }


        const durationMap = {

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

            "more than 1 month":
                "More than 1 month"

        };


        return (
            durationMap[duration] ||
            String(duration)
        );
    }


    // =====================================================
    // AGE
    // =====================================================

    function formatAge(age) {

        if (
            age === null ||
            age === undefined ||
            age === ""
        ) {

            return "Not specified";

        }

        return `${age} years`;
    }


    // =====================================================
    // STATISTICS
    // =====================================================

    function updateStatistics(history) {

        const total =
            history.length;


        // -------------------------------------------------
        // TOTAL
        // -------------------------------------------------

        if (totalDiagnoses) {

            totalDiagnoses.textContent =
                total;

        }


        // -------------------------------------------------
        // EMPTY HISTORY
        // -------------------------------------------------

        if (total === 0) {

            if (averageConfidence) {
                averageConfidence.textContent =
                    "0%";
            }

            if (commonDiagnosis) {
                commonDiagnosis.textContent =
                    "—";
            }

            if (lowConfidenceCount) {
                lowConfidenceCount.textContent =
                    "0";
            }

            return;
        }


        // -------------------------------------------------
        // AVERAGE CONFIDENCE
        // -------------------------------------------------

        const confidenceValues =
            history.map(
                item => getConfidence(item)
            );


        const average =
            confidenceValues.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / confidenceValues.length;


        if (averageConfidence) {

            averageConfidence.textContent =
                `${average.toFixed(1)}%`;

        }


        // -------------------------------------------------
        // LOW CONFIDENCE
        // -------------------------------------------------

        const lowConfidence =
            history.filter(
                item =>
                    getConfidence(item) < 60
            ).length;


        if (lowConfidenceCount) {

            lowConfidenceCount.textContent =
                lowConfidence;

        }


        // -------------------------------------------------
        // MOST COMMON DIAGNOSIS
        // -------------------------------------------------

        const diagnosisCounts = {};


        history.forEach(item => {

            const diagnosis =
                getDiagnosis(item);


            diagnosisCounts[diagnosis] =
                (diagnosisCounts[diagnosis] || 0) + 1;

        });


        const mostCommon =
            Object.entries(
                diagnosisCounts
            ).sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


        if (commonDiagnosis) {

            commonDiagnosis.textContent =
                mostCommon
                    ? mostCommon[0]
                    : "—";

        }

    }


    // =====================================================
    // RENDER HISTORY
    // =====================================================

    function renderHistory(history) {

        if (!diagnosisTableBody) {
            return;
        }


        diagnosisTableBody.innerHTML = "";


        // -------------------------------------------------
        // NO RECORDS
        // -------------------------------------------------

        if (history.length === 0) {

            if (emptyState) {

                emptyState.style.display =
                    "";

                emptyState.classList.remove(
                    "hidden"
                );

            }


            if (noSearchResults) {

                noSearchResults.style.display =
                    "none";

                noSearchResults.classList.add(
                    "hidden"
                );

            }

            return;
        }


        // -------------------------------------------------
        // RECORDS EXIST
        // -------------------------------------------------

        if (emptyState) {

            emptyState.style.display =
                "none";

            emptyState.classList.add(
                "hidden"
            );

        }


        if (noSearchResults) {

            noSearchResults.style.display =
                "none";

            noSearchResults.classList.add(
                "hidden"
            );

        }


        // -------------------------------------------------
        // CREATE ROWS
        // -------------------------------------------------

        history.forEach(
            (item, index) => {

                const diagnosis =
                    getDiagnosis(item);

                const filename =
                    getFilename(item);

                const confidence =
                    getConfidence(item);

                const date =
                    getDateValue(item);

                const symptoms =
                    getSymptoms(item);


                let symptomsText =
                    "None";


                if (symptoms.length > 0) {

                    symptomsText =
                        symptoms.join(", ");

                }


                const row =
                    document.createElement("tr");


                /*
                 IMPORTANT:

                 dashboard.html columns are:

                 Date
                 Image
                 Diagnosis
                 Confidence
                 Symptoms
                 Action
                */


                row.innerHTML = `

                    <td>
                        <span class="date-text">
                            ${escapeHTML(
                                formatDate(date)
                            )}
                        </span>
                    </td>


                    <td>
                        <span
                            class="filename"
                            title="${escapeHTML(
                                filename
                            )}"
                        >
                            ${escapeHTML(
                                filename
                            )}
                        </span>
                    </td>


                    <td>
                        <span class="diagnosis-name">
                            ${escapeHTML(
                                diagnosis
                            )}
                        </span>
                    </td>


                    <td>
                        ${getConfidenceBadge(
                            confidence
                        )}
                    </td>


                    <td>
                        <span
                            title="${escapeHTML(
                                symptomsText
                            )}"
                        >
                            ${escapeHTML(
                                symptomsText
                            )}
                        </span>
                    </td>


                    <td>
                        <button
                            type="button"
                            class="view-button"
                            data-index="${index}"
                        >
                            View Details
                        </button>
                    </td>

                `;


                diagnosisTableBody.appendChild(
                    row
                );

            }
        );


        // -------------------------------------------------
        // VIEW BUTTONS
        // -------------------------------------------------

        const viewButtons =
            diagnosisTableBody.querySelectorAll(
                ".view-button"
            );


        viewButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    if (
                        Number.isInteger(index) &&
                        history[index]
                    ) {

                        showDetails(
                            history[index]
                        );

                    }

                }
            );

        });

    }


    // =====================================================
    // SHOW DETAILS
    // =====================================================

    function showDetails(item) {

        if (
            !item ||
            !detailsSection
        ) {
            return;
        }


        const diagnosis =
            getDiagnosis(item);

        const confidence =
            getConfidence(item);

        const date =
            getDateValue(item);

        const filename =
            getFilename(item);

        const symptoms =
            getSymptoms(item);

        const recommendations =
            getRecommendations(item);

        const precautions =
            getPrecautions(item);

        const seekCare =
            getSeekCare(item);


        // -------------------------------------------------
        // BASIC INFORMATION
        // -------------------------------------------------

        if (detailDiagnosis) {

            detailDiagnosis.textContent =
                diagnosis;

        }


        if (detailConfidence) {

            detailConfidence.textContent =
                `${confidence.toFixed(1)}%`;

        }


        if (detailDate) {

            detailDate.textContent =
                formatDate(date);

        }


        if (detailAge) {

            detailAge.textContent =
                formatAge(item.age);

        }


        if (detailDuration) {

            detailDuration.textContent =
                formatDuration(
                    item.duration
                );

        }


        if (detailFilename) {

            detailFilename.textContent =
                filename;

        }


        // -------------------------------------------------
        // SYMPTOMS
        // -------------------------------------------------

        if (detailSymptoms) {

            if (symptoms.length > 0) {

                detailSymptoms.innerHTML =
                    symptoms
                        .map(
                            symptom => `
                                <span
                                    class="badge badge-primary"
                                >
                                    ${escapeHTML(
                                        symptom
                                    )}
                                </span>
                            `
                        )
                        .join(" ");

            } else {

                detailSymptoms.innerHTML =
                    "<li>No symptoms recorded</li>";

            }

        }


        // -------------------------------------------------
        // RECOMMENDATIONS
        // -------------------------------------------------

        populateList(
            detailRecommendations,
            recommendations,
            "No recommendations available"
        );


        // -------------------------------------------------
        // PRECAUTIONS
        // -------------------------------------------------

        populateList(
            detailPrecautions,
            precautions,
            "No precautions available"
        );


        // -------------------------------------------------
        // SEEK CARE
        // -------------------------------------------------

        populateList(
            detailSeekCare,
            seekCare,
            "No additional care information available"
        );


        // -------------------------------------------------
        // URGENCY
        // -------------------------------------------------

        if (detailUrgency) {

            detailUrgency.textContent =
                item.urgency ||
                "AI result available — clinical confirmation recommended";

        }


        // -------------------------------------------------
        // REPORT BUTTON
        // -------------------------------------------------

        if (viewReportButton) {

            viewReportButton.onclick =
                function () {

                    try {

                        sessionStorage.setItem(
                            "selectedDiagnosisReport",
                            JSON.stringify(item)
                        );

                    } catch (error) {

                        console.error(
                            "Unable to store report data:",
                            error
                        );

                    }

                    window.location.href =
                        "report.html";

                };

        }


        // -------------------------------------------------
        // SHOW DETAILS
        // -------------------------------------------------

        detailsSection.style.display =
            "";

        detailsSection.classList.remove(
            "hidden"
        );


        setTimeout(
            () => {

                detailsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
        );

    }


    // =====================================================
    // POPULATE LIST
    // =====================================================

    function populateList(
        element,
        items,
        emptyMessage
    ) {

        if (!element) {
            return;
        }


        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            element.innerHTML =
                `<li>${escapeHTML(
                    emptyMessage
                )}</li>`;

            return;
        }


        element.innerHTML =
            items
                .map(
                    item =>
                        `<li>${escapeHTML(
                            item
                        )}</li>`
                )
                .join("");

    }


    // =====================================================
    // SEARCH
    // =====================================================

    function performSearch() {

        const history =
            getHistory();


        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        // -------------------------------------------------
        // SHOW ALL
        // -------------------------------------------------

        if (!searchTerm) {

            renderHistory(
                history
            );

            return;

        }


        // -------------------------------------------------
        // FILTER
        // -------------------------------------------------

        const filtered =
            history.filter(item => {

                const diagnosis =
                    getDiagnosis(item)
                        .toLowerCase();


                const filename =
                    getFilename(item)
                        .toLowerCase();


                const symptoms =
                    getSymptoms(item)
                        .join(" ")
                        .toLowerCase();


                const duration =
                    formatDuration(
                        item.duration
                    )
                        .toLowerCase();


                const age =
                    String(
                        item.age || ""
                    )
                        .toLowerCase();


                return (

                    diagnosis.includes(
                        searchTerm
                    ) ||

                    filename.includes(
                        searchTerm
                    ) ||

                    symptoms.includes(
                        searchTerm
                    ) ||

                    duration.includes(
                        searchTerm
                    ) ||

                    age.includes(
                        searchTerm
                    )

                );

            });


        // -------------------------------------------------
        // NO RESULTS
        // -------------------------------------------------

        if (filtered.length === 0) {

            diagnosisTableBody.innerHTML =
                "";


            if (emptyState) {

                emptyState.style.display =
                    "none";

                emptyState.classList.add(
                    "hidden"
                );

            }


            if (noSearchResults) {

                noSearchResults.style.display =
                    "";

                noSearchResults.classList.remove(
                    "hidden"
                );

            }


            return;

        }


        // -------------------------------------------------
        // SHOW FILTERED RESULTS
        // -------------------------------------------------

        renderHistory(
            filtered
        );

    }


    // =====================================================
    // CLEAR HISTORY
    // =====================================================

    function clearHistory() {

        const history =
            getHistory();


        if (history.length === 0) {

            alert(
                "There is no diagnosis history to clear."
            );

            return;

        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete all diagnosis history?"
            );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(
            HISTORY_KEY
        );


        // Hide details
        if (detailsSection) {

            detailsSection.style.display =
                "none";

            detailsSection.classList.add(
                "hidden"
            );

        }


        // Clear search
        if (searchInput) {

            searchInput.value =
                "";

        }


        // Update dashboard
        updateStatistics([]);

        renderHistory([]);


        console.log(
            "Diagnosis history cleared."
        );

    }


    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    function closeDetails() {

        if (!detailsSection) {
            return;
        }


        detailsSection.style.display =
            "none";

        detailsSection.classList.add(
            "hidden"
        );

    }


    // =====================================================
    // REFRESH DASHBOARD
    // =====================================================

    function refreshDashboard() {

        const history =
            getHistory();


        updateStatistics(
            history
        );


        if (
            searchInput &&
            searchInput.value.trim()
        ) {

            performSearch();

        } else {

            renderHistory(
                history
            );

        }

    }


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            performSearch
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


    // =====================================================
    // INITIALIZE DASHBOARD
    // =====================================================

    refreshDashboard();


    // =====================================================
    // EXPOSE FUNCTIONS
    // =====================================================

    window.refreshOtitisDashboard =
        refreshDashboard;

    window.getOtitisDiagnosisHistory =
        getHistory;

});