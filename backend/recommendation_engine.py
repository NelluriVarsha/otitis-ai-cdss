"""
OtitisAI-CDSS Recommendation Engine

Generates clinical decision-support guidance based on:
- AI prediction
- Patient symptoms
- Symptom duration
- AI confidence

This module does NOT prescribe medicines.
It provides educational/decision-support guidance only.
"""


def generate_recommendations(
    prediction,
    symptoms=None,
    duration=None,
    confidence=None
):
    """
    Generate recommendations, precautions,
    and when-to-seek-care information.
    """

    symptoms = symptoms or []

    diagnosis = str(prediction).strip()

    # Normalize symptoms
    symptoms = [
        str(symptom).strip().lower()
        for symptom in symptoms
    ]

    recommendations = []
    precautions = []
    when_to_seek_care = []

    # =========================================================
    # GENERAL GUIDANCE
    # =========================================================

    recommendations.append(
        "Use this AI result as decision-support information "
        "and confirm the result with a qualified healthcare professional."
    )

    # =========================================================
    # ACUTE OTITIS MEDIA
    # =========================================================

    if diagnosis == "Acute Otitis Media":

        recommendations.extend([
            "Clinical evaluation is recommended, particularly when ear pain or fever is present.",
            "Monitor ear pain, fever and changes in hearing.",
            "Discuss appropriate pain or fever relief with a healthcare professional.",
            "Follow the treatment and follow-up plan provided by your healthcare professional."
        ])

        precautions.extend([
            "Do not insert cotton buds, fingers or other objects into the ear.",
            "Do not self-start antibiotics without medical advice.",
            "Avoid unnecessary irritation of the ear."
        ])

        when_to_seek_care.extend([
            "Symptoms become worse.",
            "Severe or persistent ear pain occurs.",
            "Fever becomes high or persistent.",
            "Fluid or pus starts coming from the ear.",
            "Hearing becomes noticeably reduced."
        ])

    # =========================================================
    # CHRONIC OTITIS MEDIA
    # =========================================================

    elif diagnosis == "Chronic Otitis Media":

        recommendations.extend([
            "An ENT specialist or healthcare professional evaluation is recommended.",
            "A hearing assessment may be useful when hearing difficulty is present.",
            "Monitor recurrent ear discharge, pain and hearing changes.",
            "Follow the treatment and follow-up plan provided by your healthcare professional."
        ])

        precautions.extend([
            "Do not insert cotton buds or other objects into the ear.",
            "Do not use ear drops unless recommended by a healthcare professional.",
            "Avoid self-medication."
        ])

        when_to_seek_care.extend([
            "Persistent or recurrent ear discharge occurs.",
            "Hearing loss increases.",
            "Severe pain or fever develops.",
            "Symptoms suddenly become worse."
        ])

    # =========================================================
    # CERUMEN IMPACTION
    # =========================================================

    elif diagnosis == "Cerumen Impaction":

        recommendations.extend([
            "If earwax is causing hearing difficulty, fullness or discomfort, "
            "consider professional evaluation.",
            "A healthcare professional can determine whether earwax removal is appropriate.",
            "Monitor changes in hearing and ear discomfort."
        ])

        precautions.extend([
            "Do not insert cotton buds or other objects into the ear canal.",
            "Avoid aggressive earwax removal at home.",
            "Do not place unapproved substances inside the ear."
        ])

        when_to_seek_care.extend([
            "Significant hearing loss occurs.",
            "Ear pain develops.",
            "Fluid or discharge comes from the ear.",
            "Symptoms do not improve."
        ])

    # =========================================================
    # MYRINGOSCLEROSIS
    # =========================================================

    elif diagnosis == "Myringosclerosis":

        recommendations.extend([
            "Clinical evaluation is recommended if hearing symptoms are present.",
            "Consider a hearing assessment when hearing difficulty is noticed.",
            "Continue monitoring changes in hearing or other ear symptoms."
        ])

        precautions.extend([
            "Avoid inserting objects into the ear.",
            "Avoid self-treatment without professional advice.",
            "Report new or worsening hearing changes to a healthcare professional."
        ])

        when_to_seek_care.extend([
            "Hearing loss develops or becomes worse.",
            "Ear pain or discharge develops.",
            "New significant ear symptoms occur."
        ])

    # =========================================================
    # NORMAL
    # =========================================================

    elif diagnosis == "Normal":

        recommendations.extend([
            "The uploaded image was classified as Normal by the AI model.",
            "Continue monitoring your ear health.",
            "If symptoms are present despite a Normal image classification, "
            "consider clinical evaluation."
        ])

        precautions.extend([
            "Avoid inserting cotton buds or other objects into the ear.",
            "Avoid unnecessary irritation of the ear canal."
        ])

        when_to_seek_care.extend([
            "Persistent ear pain occurs.",
            "Hearing changes develop.",
            "Ear discharge develops.",
            "Fever or worsening symptoms occur."
        ])

    # =========================================================
    # UNKNOWN / OTHER
    # =========================================================

    else:

        recommendations.extend([
            "The AI result should be reviewed by a healthcare professional.",
            "Consider repeating the image capture if image quality is poor.",
            "Do not make treatment decisions based only on the AI prediction."
        ])

        precautions.extend([
            "Do not self-medicate based solely on the AI result.",
            "Do not insert objects into the ear."
        ])

        when_to_seek_care.extend([
            "Symptoms are severe or getting worse.",
            "Hearing loss occurs.",
            "Ear discharge occurs.",
            "Persistent pain or fever occurs."
        ])

    # =========================================================
    # SYMPTOM-SPECIFIC GUIDANCE
    # =========================================================

    if "ear discharge" in symptoms:

        recommendations.append(
            "Because ear discharge is present, arrange a medical evaluation "
            "rather than relying only on the AI result."
        )

        precautions.append(
            "Do not place medication, oil or other substances into the ear "
            "unless advised by a healthcare professional."
        )

        when_to_seek_care.append(
            "Seek medical attention for persistent, bloody or pus-like ear discharge."
        )

    if "fever" in symptoms:

        recommendations.append(
            "Monitor body temperature and discuss persistent or significant "
            "fever with a healthcare professional."
        )

    if "hearing loss" in symptoms:

        recommendations.append(
            "A hearing assessment may be appropriate if hearing difficulty persists."
        )

        when_to_seek_care.append(
            "Seek medical evaluation if hearing loss is sudden, severe or worsening."
        )

    if "ear pain" in symptoms:

        recommendations.append(
            "Monitor the severity and duration of ear pain and seek clinical advice "
            "if it persists or worsens."
        )

    if "ear itching" in symptoms:

        precautions.append(
            "Avoid scratching or inserting objects into the ear canal."
        )

    if "ear fullness" in symptoms:

        recommendations.append(
            "Persistent ear fullness should be evaluated, particularly when "
            "accompanied by hearing changes or pain."
        )

    # =========================================================
    # DURATION GUIDANCE
    # =========================================================

    if duration in ["1_4_weeks", "more_than_1_month"]:

        recommendations.append(
            "Because symptoms have persisted for an extended period, "
            "professional evaluation is recommended."
        )

    # =========================================================
    # CONFIDENCE GUIDANCE
    # =========================================================

    urgency = "Clinical review recommended"

    if confidence is not None:

        try:

            confidence_value = float(confidence)

            if confidence_value < 0.60:

                urgency = (
                    "Low AI confidence — clinical review strongly recommended"
                )

                recommendations.append(
                    "The AI confidence is relatively low. Do not rely on "
                    "the prediction alone and consider professional assessment."
                )

            elif confidence_value >= 0.85:

                urgency = (
                    "AI result available — clinical confirmation recommended"
                )

        except (ValueError, TypeError):

            pass

    # =========================================================
    # REMOVE DUPLICATES
    # =========================================================

    recommendations = list(dict.fromkeys(recommendations))

    precautions = list(dict.fromkeys(precautions))

    when_to_seek_care = list(dict.fromkeys(when_to_seek_care))

    # =========================================================
    # RETURN RESULT
    # =========================================================

    return {
        "recommendations": recommendations,
        "precautions": precautions,
        "when_to_seek_care": when_to_seek_care,
        "urgency": urgency
    }