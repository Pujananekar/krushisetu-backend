const validatePartnershipApplication = (data) => {
    const errors = {}

    const organisation =
        typeof data.organisation === "string"
            ? data.organisation.trim()
            : ""

    const contact =
        typeof data.contact === "string"
            ? data.contact.trim()
            : ""

    const email =
        typeof data.email === "string"
            ? data.email.trim()
            : ""

    const mobile =
        typeof data.mobile === "string"
            ? data.mobile.trim()
            : ""

    const theme =
        typeof data.theme === "string"
            ? data.theme.trim()
            : ""

    const geography =
        typeof data.geography === "string"
            ? data.geography.trim()
            : ""

    const target =
        typeof data.target === "string"
            ? data.target.trim()
            : ""

    const timeline =
        typeof data.timeline === "string"
            ? data.timeline.trim()
            : ""

    const message =
        typeof data.message === "string"
            ? data.message.trim()
            : ""

    if (!organisation) {
        errors.organisation = "Organisation is required."
    } else if (organisation.length > 255) {
        errors.organisation =
            "Organisation must not exceed 255 characters."
    }

    if (!contact) {
        errors.contact = "Authorised contact is required."
    } else if (contact.length < 2 || contact.length > 255) {
        errors.contact =
            "Authorised contact must be between 2 and 255 characters."
    }

    if (!email) {
        errors.email = "Email address is required."
    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        errors.email = "Please enter a valid email address."
    } else if (email.length > 255) {
        errors.email =
            "Email address must not exceed 255 characters."
    }

    if (!mobile) {
        errors.mobile = "Mobile number is required."
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
        errors.mobile =
            "Please enter a valid 10-digit mobile number."
    }

    if (!theme) {
        errors.theme = "Project theme is required."
    } else if (theme.length > 255) {
        errors.theme =
            "Project theme must not exceed 255 characters."
    }

    if (!geography) {
        errors.geography = "Geography is required."
    } else if (geography.length > 255) {
        errors.geography =
            "Geography must not exceed 255 characters."
    }

    if (!target) {
        errors.target = "Target group is required."
    } else if (target.length > 255) {
        errors.target =
            "Target group must not exceed 255 characters."
    }

    if (timeline.length > 255) {
        errors.timeline =
            "Expected timeline must not exceed 255 characters."
    }

    if (message.length > 2000) {
        errors.message =
            "Message must not exceed 2000 characters."
    }

    if (data.consent !== true) {
        errors.consent = "Consent is required."
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: {
            organisation,
            contact,
            email,
            mobile,
            theme,
            geography,
            target,
            timeline,
            message,
            consent: data.consent === true,
        },
    }
}

export default validatePartnershipApplication