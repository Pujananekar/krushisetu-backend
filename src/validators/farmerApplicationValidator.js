const validateFarmerApplication = (data) => {
    const errors = {}

    const name = typeof data.name === "string" ? data.name.trim() : ""
    const mobile = typeof data.mobile === "string" ? data.mobile.trim() : ""
    const village = typeof data.village === "string" ? data.village.trim() : ""
    const taluka = typeof data.taluka === "string" ? data.taluka.trim() : ""
    const district = typeof data.district === "string" ? data.district.trim() : ""
    const pin = typeof data.pin === "string" ? data.pin.trim() : ""
    const support_interests = typeof data.support_interests === "string" ? data.support_interests.trim() : ""

    if (!name) {
        errors.name = "Name is required."
    } else if (name.length < 2 || name.length > 100) {
        errors.name = "Name must be between 2 and 100 characters."
    }

    if (!mobile) {
        errors.mobile = "Mobile number is required."
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
        errors.mobile = "Please enter a valid 10-digit mobile number."
    }

    if (!village) {
        errors.village = "Village is required."
    } else if (village.length > 150) {
        errors.village = "Village must not exceed 150 characters."
    }

    if (!taluka) {
        errors.taluka = "Taluka is required."
    } else if (taluka.length > 150) {
        errors.taluka = "Taluka must not exceed 150 characters."
    }

    if (!district) {
        errors.district = "District is required."
    } else if (district.length > 150) {
        errors.district = "District must not exceed 150 characters."
    }

    if (!pin) {
        errors.pin = "PIN code is required."
    } else if (!/^\d{6}$/.test(pin)) {
        errors.pin = "PIN code must contain exactly 6 digits."
    }

    if (support_interests.length > 2000) {
        errors.support_interests =
            "Support interests must not exceed 2000 characters."
    }

    if (data.consent !== true) {
        errors.consent = "Consent is required."
    }

    return {
        isValid : Object.keys(errors).length === 0,
        errors,
        data:{
            name,
            mobile,
            village,
            taluka,
            district,
            pin,
            support_interests,
            consent: data.consent === true,
        }
    }
}

export default validateFarmerApplication