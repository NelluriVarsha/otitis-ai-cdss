/* =========================================================
   OtitisAI-CDSS — Doctor Dashboard JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------
    // Elements
    // -----------------------------------------------------

    const totalDiagnoses = document.getElementById("totalDiagnoses");
    const averageConfidence = document.getElementById("averageConfidence");
    const commonDiagnosis = document.getElementById("commonDiagnosis");
    const lowConfidenceCount = document.getElementById("lowConfidenceCount");

    const searchInput = document.getElementById("searchInput");
    const refreshButton = document.getElementById("refreshButton");
    const clearHistoryButton = document.getElementById("clearHistoryButton");

    const diagnosisTableBody = document.getElementById("diagnosisTableBody");
    const emptyState = document.getElementById("emptyState");
    const noSearchResults = document.getElementById("noSearchResults");

    const detailsSection = document.getElementById("detailsSection");
    const closeDetailsButton = document.getElementById("closeDetailsButton");

    const detailDiagnosis = document.getElementById("detailDiagnosis");
    const detailConfidence = document.getElementById("detailConfidence");
    const detailDate = document.getElementById("detailDate");
    const detailAge = document.getElementById("detailAge");
    const detailDuration = document.getElementById("detailDuration");
    const detailFilename = document.getElementById("detailFilename");
    const detailSymptoms = document.getElementById("detailSymptoms");
    const detailRecommendations = document.getElementById("detailRecommendations");
    const detailPrecautions = document.getElementById("detailPrecautions");
    const detailSeekCare = document.getElementById("detailSeekCare");
    const detailUrgency = document.getElementById("detailUrgency");

    const viewReportButton = document.getElementById("viewReportButton");


    // -----------------------------------------------------
    // Local Storage
    // -----------------------------------------------------

    const HISTORY_KEY = "otitisDiagnosisHistory";

    function getHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY));

            if (Array.isArray(history)) {
                return history;
            }

            return [];
        } catch (error) {
            console.error("Unable to read diagnosis history:", error);
            return [];
        }
    }


    function saveHistory(history) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }


    // -----------------------------------------------------
    // Helpers
    // -----------------------------------------------------

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "Unknown";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    function formatDuration(duration) {

        const durationMap = {
            "less_than_1_week": "Less than 1 week",
            "1_4_weeks": "1–4 weeks",
            "more_than_1_month": "More than 1 month"
        };

        return durationMap[duration] || duration || "Not specified";
    }


    function formatConfidence(value) {

        let confidence = Number(value);

        if (Number.isNaN(confidence)) {
            return "N/A";
        }

        // Backend may return either 0–1 or 0–100.
        if (confidence <= 1) {
            confidence *= 100;
        }

        return `${confidence.toFixed(1)}%`;
    }


    function getConfidenceNumber(value) {

        let confidence = Number(value);

        if (Number.isNaN(confidence)) {
            return 0;
        }

        if (confidence <= 1) {
            confidence *= 100;
        }

        return confidence;
    }


    function getConfidenceBadge(value) {

        const confidence = getConfidenceNumber(value);

        if (confidence >= 80) {
            return `<span class="badge badge-success">${confidence.toFixed(1)}%</span>`;
        }

        if (confidence >= 60) {
            return `<span class="badge badge-warning">${confidence.toFixed(1)}%</span>`;
        }

        return `<span class="badge badge-danger">${confidence.toFixed(1)}%</span>`;
    }


    function normalizeDiagnosis(item) {

        return (
            item.prediction ||
            item.diagnosis ||
            item.predicted_class ||
            item.class_name ||
            "Unknown"
        );
    }


    function getSymptoms(item) {

        if (Array.isArray(item.symptoms)) {
            return item.symptoms;
        }

        if (typeof item.symptoms === "string") {
            if (!item.symptoms.trim()) {
                return [];
            }

            return item.symptoms
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
        }

        return [];
    }


    function getRecommendations(item) {

        if (Array.isArray(item.recommendations)) {
            return item.recommendations;
        }

        if (typeof item.recommendations === "string") {
            return [item.recommendations];
        }

        return [];
    }


    function getPrecautions(item) {

        if (Array.isArray(item.precautions)) {
            return item.precautions;
        }

        if (typeof item.precautions === "string") {
            return [item.precautions];
        }

        return [];
    }


    function getSeekCare(item) {

        if (Array.isArray(item.when_to_seek_care)) {
            return item.when_to_seek_care;
        }

        if (typeof item.when_to_seek_care === "string") {
            return [item.when_to_seek_care];
        }

        return [];
    }


    // -----------------------------------------------------
    // Statistics
    // -----------------------------------------------------

    function updateStatistics(history) {

        const total = history.length;

        if (totalDiagnoses) {
            totalDiagnoses.textContent = total;
        }

        if (total === 0) {

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


        // Average confidence
        const confidenceValues = history
            .map(item => getConfidenceNumber(
                item.confidence_percentage ?? item.confidence
            ))
            .filter(value => value > 0);


        const average = confidenceValues.length
            ? confidenceValues.reduce((sum, value) => sum + value, 0) /
              confidenceValues.length
            : 0;


        if (averageConfidence) {
            averageConfidence.textContent = `${average.toFixed(1)}%`;
        }


        // Low confidence
        const lowConfidence = history.filter(item => {

            const confidence = getConfidenceNumber(
                item.confidence_percentage ?? item.confidence
            );

            return confidence < 60;
        }).length;


        if (lowConfidenceCount) {
            lowConfidenceCount.textContent = lowConfidence;
        }


        // Most common diagnosis
        const diagnosisCounts = {};

        history.forEach(item => {

            const diagnosis = normalizeDiagnosis(item);

            diagnosisCounts[diagnosis] =
                (diagnosisCounts[diagnosis] || 0) + 1;
        });


        const mostCommon = Object.entries(diagnosisCounts)
            .sort((a, b) => b[1] - a[1])[0];


        if (commonDiagnosis) {
            commonDiagnosis.textContent =
                mostCommon ? mostCommon[0] : "—";
        }
    }


    // -----------------------------------------------------
    // Render History Table
    // -----------------------------------------------------

    function renderHistory(history) {

        if (!diagnosisTableBody) {
            return;
        }

        diagnosisTableBody.innerHTML = "";


        if (history.length === 0) {

            if (emptyState) {
                emptyState.classList.remove("hidden");
            }

            if (noSearchResults) {
                noSearchResults.classList.add("hidden");
            }

            return;
        }


        if (emptyState) {
            emptyState.classList.add("hidden");
        }

        if (noSearchResults) {
            noSearchResults.classList.add("hidden");
        }


        history.forEach((item, index) => {

            const diagnosis = normalizeDiagnosis(item);

            const confidence =
                item.confidence_percentage ??
                item.confidence ??
                0;

            const filename =
                item.filename ||
                item.file_name ||
                "—";

            const date =
                item.timestamp ||
                item.date ||
                item.created_at;


            const row = document.createElement("tr");


            row.innerHTML = `
                <td>
                    <span class="diagnosis-name">
                        ${escapeHTML(diagnosis)}
                    </span>
                </td>

                <td>
                    ${getConfidenceBadge(confidence)}
                </td>

                <td>
                    <span class="date-text">
                        ${escapeHTML(formatDate(date))}
                    </span>
                </td>

                <td>
                    <span class="filename" title="${escapeHTML(filename)}">
                        ${escapeHTML(filename)}
                    </span>
                </td>

                <td>
                    <button
                        class="view-button"
                        type="button"
                        data-index="${index}">
                        View Details
                    </button>
                </td>
            `;


            diagnosisTableBody.appendChild(row);
        });


        // Attach detail button events
        const viewButtons =
            diagnosisTableBody.querySelectorAll(".view-button");


        viewButtons.forEach(button => {

            button.addEventListener("click", () => {

                const index = Number(button.dataset.index);

                if (!Number.isNaN(index)) {
                    showDetails(history[index]);
                }
            });
        });
    }


    // -----------------------------------------------------
    // Show Diagnosis Details
    // -----------------------------------------------------

    function showDetails(item) {

        if (!item || !detailsSection) {
            return;
        }


        const diagnosis = normalizeDiagnosis(item);

        const confidence =
            item.confidence_percentage ??
            item.confidence ??
            0;

        const date =
            item.timestamp ||
            item.date ||
            item.created_at;


        if (detailDiagnosis) {
            detailDiagnosis.textContent = diagnosis;
        }


        if (detailConfidence) {
            detailConfidence.textContent =
                formatConfidence(confidence);
        }


        if (detailDate) {
            detailDate.textContent =
                formatDate(date);
        }


        if (detailAge) {
            detailAge.textContent =
                item.age ? `${item.age} years` : "Not specified";
        }


        if (detailDuration) {
            detailDuration.textContent =
                formatDuration(item.duration);
        }


        if (detailFilename) {
            detailFilename.textContent =
                item.filename ||
                item.file_name ||
                "Not available";
        }


        // Symptoms
        const symptoms = getSymptoms(item);

        if (detailSymptoms) {

            if (symptoms.length > 0) {

                detailSymptoms.innerHTML = symptoms
                    .map(symptom =>
                        `<span class="badge badge-primary">
                            ${escapeHTML(symptom)}
                        </span>`
                    )
                    .join(" ");

            } else {

                detailSymptoms.textContent =
                    "No symptoms recorded";
            }
        }


        // Recommendations
        populateList(
            detailRecommendations,
            getRecommendations(item),
            "No recommendations available"
        );


        // Precautions
        populateList(
            detailPrecautions,
            getPrecautions(item),
            "No precautions available"
        );


        // When to seek care
        populateList(
            detailSeekCare,
            getSeekCare(item),
            "No additional care information available"
        );


        // Urgency
        if (detailUrgency) {

            detailUrgency.textContent =
                item.urgency ||
                "Routine clinical review recommended based on the available information.";
        }


        // Report button
        if (viewReportButton) {

            viewReportButton.onclick = () => {

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

                window.location.href = "report.html";
            };
        }


        detailsSection.classList.remove("hidden");

        setTimeout(() => {
            detailsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);
    }


    // -----------------------------------------------------
    // Populate Lists
    // -----------------------------------------------------

    function populateList(element, items, emptyMessage) {

        if (!element) {
            return;
        }


        if (!items || items.length === 0) {

            element.innerHTML =
                `<li>${escapeHTML(emptyMessage)}</li>`;

            return;
        }


        element.innerHTML = items
            .map(item =>
                `<li>${escapeHTML(item)}</li>`
            )
            .join("");
    }


    // -----------------------------------------------------
    // Search
    // -----------------------------------------------------

    function performSearch() {

        const history = getHistory();

        const searchTerm =
            searchInput ?
            searchInput.value.trim().toLowerCase() :
            "";


        if (!searchTerm) {

            renderHistory(history);
            return;
        }


        const filtered = history.filter(item => {

            const diagnosis =
                normalizeDiagnosis(item).toLowerCase();

            const filename =
                (
                    item.filename ||
                    item.file_name ||
                    ""
                ).toLowerCase();

            const symptoms =
                getSymptoms(item)
                    .join(" ")
                    .toLowerCase();

            const duration =
                formatDuration(item.duration)
                    .toLowerCase();


            return (
                diagnosis.includes(searchTerm) ||
                filename.includes(searchTerm) ||
                symptoms.includes(searchTerm) ||
                duration.includes(searchTerm)
            );
        });


        if (filtered.length === 0) {

            diagnosisTableBody.innerHTML = "";

            if (emptyState) {
                emptyState.classList.add("hidden");
            }

            if (noSearchResults) {
                noSearchResults.classList.remove("hidden");
            }

            return;
        }


        renderHistory(filtered);
    }


    // -----------------------------------------------------
    // Clear History
    // -----------------------------------------------------

    function clearHistory() {

        const history = getHistory();

        if (history.length === 0) {
            return;
        }


        const confirmed = window.confirm(
            "Are you sure you want to delete all diagnosis history?"
        );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(HISTORY_KEY);


        if (detailsSection) {
            detailsSection.classList.add("hidden");
        }


        if (searchInput) {
            searchInput.value = "";
        }


        updateStatistics([]);

        renderHistory([]);

        console.log("Diagnosis history cleared.");
    }


    // -----------------------------------------------------
    // Close Details
    // -----------------------------------------------------

    function closeDetails() {

        if (detailsSection) {
            detailsSection.classList.add("hidden");
        }
    }


    // -----------------------------------------------------
    // Refresh Dashboard
    // -----------------------------------------------------

    function refreshDashboard() {

        const history = getHistory();

        updateStatistics(history);

        if (searchInput && searchInput.value.trim()) {
            performSearch();
        } else {
            renderHistory(history);
        }
    }


    // -----------------------------------------------------
    // Event Listeners
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // Initial Load
    // -----------------------------------------------------

    refreshDashboard();

});