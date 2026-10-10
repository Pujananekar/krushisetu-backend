import pool from "../../config/db.js"
import wrapAsync from "../../utils/tryCatchWrapper.js"

export const getApplications = wrapAsync(async (req, res) => {
    const [applications] = await pool.query(`
        SELECT
            id,
            reference_number,
            application_type,
            status,
            consent,
            created_at,
            updated_at
        FROM applications
        ORDER BY created_at DESC
    `)

    return res.status(200).json({
        success: true,
        data: applications,
    })
})

export const getApplicationById = wrapAsync(async (req, res) => {
    const { id } = req.params

    const [applications] = await pool.query(
        `
            SELECT
                id,
                reference_number,
                application_type,
                status,
                consent,
                created_at,
                updated_at
            FROM applications
            WHERE id = ?
            LIMIT 1
        `,
        [id],
    )

    if (applications.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Application not found!",
        })
    }

    const application = applications[0]

    const detailTableMap = {
        FARMER: "farmer_applications",
        TRAINING: "training_applications",
        SERVICE: "service_applications",
        INTERNSHIP: "internship_applications",
        FPO: "fpo_applications",
        PARTNERSHIP: "partnership_applications",
        VOLUNTEER: "volunteer_applications",
    }

    const detailTable =
        detailTableMap[application.application_type]

    let details = null

    if (detailTable) {
        const [detailRows] = await pool.query(
            `
                SELECT *
                FROM ${detailTable}
                WHERE application_id = ?
                LIMIT 1
            `,
            [application.id],
        )

        details = detailRows[0] || null
    }

    let applicant = {
        name: null,
        mobile: null,
        email: null,
    }

    let location = {
        village: null,
        taluka: null,
        district: null,
        pin: null,
        value: null,
    }

    if (application.application_type === "FARMER" && details) {
        applicant = {
            name: details.name,
            mobile: details.mobile,
            email: null,
        }

        location = {
            village: details.village,
            taluka: details.taluka,
            district: details.district,
            pin: details.pin,
            value: null,
        }
    }

    if (application.application_type === "TRAINING" && details) {
        applicant = {
            name: details.name,
            mobile: details.mobile,
            email: null,
        }

        location = {
            village: details.village,
            taluka: null,
            district: details.district,
            pin: null,
            value: null,
        }
    }

    if (application.application_type === "SERVICE" && details) {
        applicant = {
            name: details.name,
            mobile: details.mobile,
            email: null,
        }

        location = {
            village: null,
            taluka: null,
            district: null,
            pin: null,
            value: details.location,
        }
    }

    if (application.application_type === "INTERNSHIP" && details) {
        applicant = {
            name: details.name,
            mobile: null,
            email: null,
        }

        location = {
            village: null,
            taluka: null,
            district: null,
            pin: null,
            value: details.location,
        }
    }

    if (application.application_type === "FPO" && details) {
        applicant = {
            name: details.organisation,
            mobile: details.contact,
            email: null,
        }

        location = {
            village: null,
            taluka: null,
            district: details.district,
            pin: null,
            value: null,
        }
    }

    if (application.application_type === "PARTNERSHIP" && details) {
        applicant = {
            name: details.organisation,
            mobile: details.mobile,
            email: details.email,
        }

        location = {
            village: null,
            taluka: null,
            district: null,
            pin: null,
            value: details.geography,
        }
    }

    if (application.application_type === "VOLUNTEER" && details) {
        applicant = {
            name: details.name,
            mobile: details.mobile,
            email: null,
        }

        location = {
            village: null,
            taluka: null,
            district: null,
            pin: null,
            value: details.location,
        }
    }

    return res.status(200).json({
        success: true,
        data: {
            ...application,
            applicant,
            location,
            details,
        },
    })
})

export const updateApplication = wrapAsync(async (req, res) => {
    const { id } = req.params

    const {
        status,
        consent,
        name,
        mobile,
        email,
        village,
        taluka,
        district,
        pin,
        location,

        support_interests,

        program,
        participant,
        organisation,
        accessibility_needs,

        crop,
        category,
        urgency,
        problem,

        college,
        course,
        duration,
        interest,
        additional_information,

        contact,
        members,
        commodity,
        fpo_status,
        support_required,

        theme,
        geography,
        target,
        timeline,
        message,

        expertise,
        experience,
        availability,
        contribution,
    } = req.body

    const allowedStatuses = [
        "NEW",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
    ]

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application status.",
        })
    }

    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const [applicationRows] = await connection.query(
            `
                SELECT
                    id,
                    application_type
                FROM applications
                WHERE id = ?
                LIMIT 1
            `,
            [id],
        )

        if (applicationRows.length === 0) {
            await connection.rollback()

            return res.status(404).json({
                success: false,
                message: "Application not found!",
            })
        }

        const application = applicationRows[0]

        /*
         * Update main application record
         */
        const applicationUpdates = []
        const applicationValues = []

        if (status !== undefined) {
            applicationUpdates.push("status = ?")
            applicationValues.push(status)
        }

        if (consent !== undefined) {
            applicationUpdates.push("consent = ?")
            applicationValues.push(Boolean(consent))
        }

        if (applicationUpdates.length > 0) {
            applicationValues.push(id)

            await connection.query(
                `
                    UPDATE applications
                    SET ${applicationUpdates.join(", ")}
                    WHERE id = ?
                `,
                applicationValues,
            )
        }

        /*
         * Update type-specific application record
         */
        switch (application.application_type) {
            case "FARMER": {
                const updates = []
                const values = []

                if (name !== undefined) {
                    updates.push("name = ?")
                    values.push(name)
                }

                if (mobile !== undefined) {
                    updates.push("mobile = ?")
                    values.push(mobile)
                }

                if (village !== undefined) {
                    updates.push("village = ?")
                    values.push(village)
                }

                if (taluka !== undefined) {
                    updates.push("taluka = ?")
                    values.push(taluka)
                }

                if (district !== undefined) {
                    updates.push("district = ?")
                    values.push(district)
                }

                if (pin !== undefined) {
                    updates.push("pin = ?")
                    values.push(pin)
                }

                if (support_interests !== undefined) {
                    updates.push("support_interests = ?")
                    values.push(support_interests)
                }

                await updateDetailTable(
                    connection,
                    "farmer_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "TRAINING": {
                const updates = []
                const values = []

                if (program !== undefined) {
                    updates.push("program = ?")
                    values.push(program)
                }

                if (name !== undefined) {
                    updates.push("name = ?")
                    values.push(name)
                }

                if (mobile !== undefined) {
                    updates.push("mobile = ?")
                    values.push(mobile)
                }

                if (village !== undefined) {
                    updates.push("village = ?")
                    values.push(village)
                }

                if (district !== undefined) {
                    updates.push("district = ?")
                    values.push(district)
                }

                if (participant !== undefined) {
                    updates.push("participant = ?")
                    values.push(participant)
                }

                if (organisation !== undefined) {
                    updates.push("organisation = ?")
                    values.push(organisation)
                }

                if (accessibility_needs !== undefined) {
                    updates.push("accessibility_needs = ?")
                    values.push(accessibility_needs)
                }

                await updateDetailTable(
                    connection,
                    "training_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "SERVICE": {
                const updates = []
                const values = []

                if (name !== undefined) {
                    updates.push("name = ?")
                    values.push(name)
                }

                if (mobile !== undefined) {
                    updates.push("mobile = ?")
                    values.push(mobile)
                }

                if (crop !== undefined) {
                    updates.push("crop = ?")
                    values.push(crop)
                }

                if (location !== undefined) {
                    updates.push("location = ?")
                    values.push(location)
                }

                if (category !== undefined) {
                    updates.push("category = ?")
                    values.push(category)
                }

                if (urgency !== undefined) {
                    updates.push("urgency = ?")
                    values.push(urgency)
                }

                if (problem !== undefined) {
                    updates.push("problem = ?")
                    values.push(problem)
                }

                await updateDetailTable(
                    connection,
                    "service_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "INTERNSHIP": {
                const updates = []
                const values = []

                if (name !== undefined) {
                    updates.push("name = ?")
                    values.push(name)
                }

                if (college !== undefined) {
                    updates.push("college = ?")
                    values.push(college)
                }

                if (course !== undefined) {
                    updates.push("course = ?")
                    values.push(course)
                }

                if (location !== undefined) {
                    updates.push("location = ?")
                    values.push(location)
                }

                if (duration !== undefined) {
                    updates.push("duration = ?")
                    values.push(duration)
                }

                if (interest !== undefined) {
                    updates.push("interest = ?")
                    values.push(interest)
                }

                if (additional_information !== undefined) {
                    updates.push("additional_information = ?")
                    values.push(additional_information)
                }

                await updateDetailTable(
                    connection,
                    "internship_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "FPO": {
                const updates = []
                const values = []

                if (organisation !== undefined) {
                    updates.push("organisation = ?")
                    values.push(organisation)
                }

                if (contact !== undefined) {
                    updates.push("contact = ?")
                    values.push(contact)
                }

                if (district !== undefined) {
                    updates.push("district = ?")
                    values.push(district)
                }

                if (members !== undefined) {
                    updates.push("members = ?")
                    values.push(
                        members === "" ? null : Number(members),
                    )
                }

                if (commodity !== undefined) {
                    updates.push("commodity = ?")
                    values.push(commodity)
                }

                if (fpo_status !== undefined) {
                    updates.push("status = ?")
                    values.push(fpo_status)
                }

                if (support_required !== undefined) {
                    updates.push("support_required = ?")
                    values.push(support_required)
                }

                await updateDetailTable(
                    connection,
                    "fpo_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "PARTNERSHIP": {
                const updates = []
                const values = []

                if (organisation !== undefined) {
                    updates.push("organisation = ?")
                    values.push(organisation)
                }

                if (contact !== undefined) {
                    updates.push("contact = ?")
                    values.push(contact)
                }

                if (email !== undefined) {
                    updates.push("email = ?")
                    values.push(email)
                }

                if (mobile !== undefined) {
                    updates.push("mobile = ?")
                    values.push(mobile)
                }

                if (theme !== undefined) {
                    updates.push("theme = ?")
                    values.push(theme)
                }

                if (geography !== undefined) {
                    updates.push("geography = ?")
                    values.push(geography)
                }

                if (target !== undefined) {
                    updates.push("target = ?")
                    values.push(target)
                }

                if (timeline !== undefined) {
                    updates.push("timeline = ?")
                    values.push(timeline)
                }

                if (message !== undefined) {
                    updates.push("message = ?")
                    values.push(message)
                }

                await updateDetailTable(
                    connection,
                    "partnership_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            case "VOLUNTEER": {
                const updates = []
                const values = []

                if (name !== undefined) {
                    updates.push("name = ?")
                    values.push(name)
                }

                if (mobile !== undefined) {
                    updates.push("mobile = ?")
                    values.push(mobile)
                }

                if (location !== undefined) {
                    updates.push("location = ?")
                    values.push(location)
                }

                if (expertise !== undefined) {
                    updates.push("expertise = ?")
                    values.push(expertise)
                }

                if (experience !== undefined) {
                    updates.push("experience = ?")
                    values.push(experience)
                }

                if (availability !== undefined) {
                    updates.push("availability = ?")
                    values.push(availability)
                }

                if (contribution !== undefined) {
                    updates.push("contribution = ?")
                    values.push(contribution)
                }

                await updateDetailTable(
                    connection,
                    "volunteer_applications",
                    id,
                    updates,
                    values,
                )

                break
            }

            default:
                await connection.rollback()

                return res.status(400).json({
                    success: false,
                    message: "Unsupported application type.",
                })
        }

        await connection.commit()

        const [updatedRows] = await connection.query(
            `
                SELECT
                    id,
                    reference_number,
                    application_type,
                    status,
                    consent,
                    created_at,
                    updated_at
                FROM applications
                WHERE id = ?
                LIMIT 1
            `,
            [id],
        )

        return res.status(200).json({
            success: true,
            message: "Application updated successfully.",
            data: updatedRows[0],
        })
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
})

const updateDetailTable = async (
    connection,
    table,
    applicationId,
    updates,
    values,
) => {
    if (updates.length === 0) {
        return
    }

    values.push(applicationId)

    await connection.query(
        `
            UPDATE ${table}
            SET ${updates.join(", ")}
            WHERE application_id = ?
        `,
        values,
    )
}