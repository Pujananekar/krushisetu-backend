const validateInternshipApplication = (data) => {
    const errors = {}

    const name =
        typeof data.name === "string" ? data.name.trim() : ""

    const college =
        typeof data.college === "string" ? data.college.trim() : ""

    const course =
        typeof data.course === "string" ? data.course.trim() : ""

    const location =
        typeof data.location === "string" ? data.location.trim() : ""

    const duration =
        typeof data.duration === "string" ? data.duration.trim() : ""

    const interest =
        typeof data.interest === "string" ? data.interest.trim() : ""

    const additional_information =
        typeof data.additionalInformation === "string"
            ? data.additionalInformation.trim()
            : ""

    if (!name) {
        errors.name = "Name is required."
    } else if (name.length < 2 || name.length > 100) {
        errors.name = "Name must be between 2 and 100 characters."
    }

    if (!college) {
        errors.college = "College or university is required."
    } else if (college.length > 255) {
        errors.college =
            "College or university must not exceed 255 characters."
    }

    if (!course) {
        errors.course = "Course or year is required."
    } else if (course.length > 255) {
        errors.course =
            "Course or year must not exceed 255 characters."
    }

    if (!location) {
        errors.location = "Location is required."
    } else if (location.length > 255) {
        errors.location =
            "Location must not exceed 255 characters."
    }

    if (!duration) {
        errors.duration = "Internship duration is required."
    } else if (duration.length > 150) {
        errors.duration =
            "Internship duration must not exceed 150 characters."
    }

    if (!interest) {
        errors.interest = "Area of interest is required."
    } else if (interest.length > 255) {
        errors.interest =
            "Area of interest must not exceed 255 characters."
    }

    if (additional_information.length > 2000) {
        errors.additional_information =
            "Additional information must not exceed 2000 characters."
    }

    if (data.consent !== true) {
        errors.consent = "Consent is required."
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            name,
            college,
            course,
            location,
            duration,
            interest,
            additional_information,
            consent: data.consent === true,
        },
    }
}

export default validateInternshipApplication