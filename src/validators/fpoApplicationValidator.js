const validateFPOApplication = (data) => {
    const errors = {}

    const organisation =
        typeof data.organisation === "string"
            ? data.organisation.trim()
            : ""

    const contact =
        typeof data.contact === "string"
            ? data.contact.trim()
            : ""

    const district =
        typeof data.district === "string"
            ? data.district.trim()
            : ""

    const members =
        typeof data.members === "string"
            ? data.members.trim()
            : ""

    const commodity =
        typeof data.commodity === "string"
            ? data.commodity.trim()
            : ""

    const status =
        typeof data.status === "string"
            ? data.status.trim()
            : ""

    const support_required =
        typeof data.supportRequired === "string"
            ? data.supportRequired.trim()
            : ""

    if (!organisation) {
        errors.organisation = "Organisation or group is required."
    } else if (organisation.length > 255) {
        errors.organisation =
            "Organisation or group must not exceed 255 characters."
    }

    if (!contact) {
        errors.contact = "Contact person is required."
    } else if (contact.length < 2 || contact.length > 255) {
        errors.contact =
            "Contact person must be between 2 and 255 characters."
    }

    if (!district) {
        errors.district = "District is required."
    } else if (district.length > 150) {
        errors.district =
            "District must not exceed 150 characters."
    }

    if (members) {
        if (!/^\d+$/.test(members)) {
            errors.members =
                "Member count must contain only numbers."
        } else if (Number(members) > 4294967295) {
            errors.members =
                "Member count is too large."
        }
    }

    if (commodity.length > 255) {
        errors.commodity =
            "Commodity or activity must not exceed 255 characters."
    }

    if (status.length > 255) {
        errors.status =
            "Current status must not exceed 255 characters."
    }

    if (support_required.length > 2000) {
        errors.support_required =
            "Support required must not exceed 2000 characters."
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
            district,
            members: members ? Number(members) : null,
            commodity,
            status,
            support_required,
            consent: data.consent === true,
        },
    }
}

export default validateFPOApplication