const validateTrainingApplication = (data) => {
    const errors = {}

    const program =
        typeof data.program === "string" ? data.program.trim() : ""

    const name =
        typeof data.name === "string" ? data.name.trim() : ""

    const mobile =
        typeof data.mobile === "string" ? data.mobile.trim() : ""

    const village =
        typeof data.village === "string" ? data.village.trim() : ""

    const district =
        typeof data.district === "string" ? data.district.trim() : ""

    const participant =
        typeof data.participant === "string" ? data.participant.trim() : ""

    const organisation =
        typeof data.organisation === "string"
            ? data.organisation.trim()
            : ""

    const accessibility_needs =
        typeof data.accessibilityNeeds === "string"
            ? data.accessibilityNeeds.trim()
            : ""

    if (!program) {
        errors.program = "Training programme is required."
    } else if (program.length > 255) {
        errors.program =
            "Training programme must not exceed 255 characters."
    }

    if (!name) {
        errors.name = "Name is required."
    } else if (name.length < 2 || name.length > 100) {
        errors.name = "Name must be between 2 and 100 characters."
    }

    if (!mobile) {
        errors.mobile = "Mobile number or email is required."
    } else {
        const isMobile = /^[6-9]\d{9}$/.test(mobile)
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mobile)

        if (!isMobile && !isEmail) {
            errors.mobile =
                "Please enter a valid 10-digit mobile number or email."
        }
    }

    if (!village) {
        errors.village = "Village is required."
    } else if (village.length > 150) {
        errors.village = "Village must not exceed 150 characters."
    }

    if (!district) {
        errors.district = "District is required."
    } else if (district.length > 150) {
        errors.district = "District must not exceed 150 characters."
    }

    if (!participant) {
        errors.participant = "Participant type is required."
    } else if (participant.length > 150) {
        errors.participant =
            "Participant type must not exceed 150 characters."
    }

    if (organisation.length > 255) {
        errors.organisation =
            "Organisation must not exceed 255 characters."
    }

    if (accessibility_needs.length > 2000) {
        errors.accessibility_needs =
            "Accessibility needs must not exceed 2000 characters."
    }

    if (data.consent !== true) {
        errors.consent = "Consent is required."
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            program,
            name,
            mobile,
            village,
            district,
            participant,
            organisation,
            accessibility_needs,
            consent: data.consent === true,
        },
    }
}

export default validateTrainingApplication