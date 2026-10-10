const validateVolunteerApplication = (data) => {
    const errors = {}

    const name =
        typeof data.name === "string"
            ? data.name.trim()
            : ""

    const mobile =
        typeof data.mobile === "string"
            ? data.mobile.trim()
            : ""

    const location =
        typeof data.location === "string"
            ? data.location.trim()
            : ""

    const expertise =
        typeof data.expertise === "string"
            ? data.expertise.trim()
            : ""

    const experience =
        typeof data.experience === "string"
            ? data.experience.trim()
            : ""

    const availability =
        typeof data.availability === "string"
            ? data.availability.trim()
            : ""

    const contribution =
        typeof data.contribution === "string"
            ? data.contribution.trim()
            : ""

    if (!name) {
        errors.name = "Name is required."
    } else if (name.length < 2 || name.length > 100) {
        errors.name =
            "Name must be between 2 and 100 characters."
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

    if (!location) {
        errors.location = "Location is required."
    } else if (location.length > 255) {
        errors.location =
            "Location must not exceed 255 characters."
    }

    if (!expertise) {
        errors.expertise = "Expertise is required."
    } else if (expertise.length > 255) {
        errors.expertise =
            "Expertise must not exceed 255 characters."
    }

    if (experience.length > 255) {
        errors.experience =
            "Experience must not exceed 255 characters."
    }

    if (availability.length > 255) {
        errors.availability =
            "Availability must not exceed 255 characters."
    }

    if (contribution.length > 2000) {
        errors.contribution =
            "Contribution must not exceed 2000 characters."
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
            location,
            expertise,
            experience,
            availability,
            contribution,
            consent: data.consent === true,
        },
    }
}

export default validateVolunteerApplication