# =========================================================
# OtitisAI-CDSS
# Severity Assessment Engine
# =========================================================

def calculate_severity(
    prediction,
    symptoms=None,
    duration="",
    age=""
):
    """
    AI-assisted severity estimation.

    This is a prototype rule-based severity layer.
    It should not be treated as a medically validated
    clinical severity score.
    """

    if symptoms is None:
        symptoms = []

    symptoms = [
        str(s).strip().lower()
        for s in symptoms
    ]

    score = 0
    factors = []

    # -----------------------------------------------------
    # SYMPTOMS
    # -----------------------------------------------------

    if "ear pain" in symptoms:
        score += 2
        factors.append("Ear pain")

    if "ear discharge" in symptoms:
        score += 2
        factors.append("Ear discharge")

    if "fever" in symptoms:
        score += 2
        factors.append("Fever")

    if "hearing loss" in symptoms:
        score += 2
        factors.append("Hearing loss")

    if "itching" in symptoms:
        score += 1
        factors.append("Itching")

    if "recent cold" in symptoms:
        score += 1
        factors.append("Recent cold")

    # -----------------------------------------------------
    # DURATION
    # -----------------------------------------------------

    duration_text = str(duration).lower().strip()

    # Check the specific short-duration condition first.
    # "Less than 1 week" contains the word "week", so
    # this condition must come before the general check.

    if "less than 1 week" in duration_text:
        score += 1
        factors.append("Recent symptoms")

    elif (
        "more than" in duration_text
        or "week" in duration_text
        or "month" in duration_text
    ):
        score += 2
        factors.append("Longer symptom duration")

    # -----------------------------------------------------
    # DIAGNOSIS-SPECIFIC FACTORS
    # -----------------------------------------------------

    prediction_text = str(prediction).lower()

    if "chronic" in prediction_text:
        score += 2
        factors.append("Chronic diagnosis")

    if "suppurative" in prediction_text:
        score += 2
        factors.append("Suppurative condition")

    if "perforation" in prediction_text:
        score += 3
        factors.append(
            "Possible tympanic membrane perforation"
        )

    # -----------------------------------------------------
    # SEVERITY CLASSIFICATION
    # -----------------------------------------------------

    if score <= 2:
        severity = "Mild"

    elif score <= 5:
        severity = "Moderate"

    else:
        severity = "Severe"

    # -----------------------------------------------------
    # RETURN RESULT
    # -----------------------------------------------------

    return {
        "severity": severity,
        "severity_score": score,
        "severity_factors": factors
    }