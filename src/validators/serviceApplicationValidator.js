const validateServiceApplication = (data) => {
    const errors = {}

    const name =
        typeof data.name === "string" ? data.name.trim() : ""

    const mobile =
        typeof data.mobile === "string" ? data.mobile.trim() : ""

    const crop =
        typeof data.crop === "string" ? data.crop.trim() : ""

    const location =
        typeof data.location === "string" ? data.location.trim() : ""

    const category =
        typeof data.category === "string" ? data.category.trim() : ""

    const urgency =
        typeof data.urgency === "string" ? data.urgency.trim() : ""

    const problem =
        typeof data.problem === "string" ? data.problem.trim() : ""

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

    if (!crop) {
        errors.crop = "Crop or activity is required."
    } else if (crop.length > 255) {
        errors.crop = "Crop or activity must not exceed 255 characters."
    }

    if (!location) {
        errors.location = "Location is required."
    } else if (location.length > 255) {
        errors.location = "Location must not exceed 255 characters."
    }

    if (!category) {
        errors.category = "Support category is required."
    } else if (category.length > 255) {
        errors.category =
            "Support category must not exceed 255 characters."
    }

    if (urgency.length > 100) {
        errors.urgency = "Urgency must not exceed 100 characters."
    }

    if (problem.length > 2000) {
        errors.problem =
            "Problem or requirement must not exceed 2000 characters."
    }

    if (data.consent !== true) {
        errors.consent = "Consent is required."
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            name,
            mobile,
            crop,
            location,
            category,
            urgency,
            problem,
            consent: data.consent === true,
        },
    }
}

export default validateServiceApplication