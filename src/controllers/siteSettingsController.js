import pool from "../config/db.js";
import wrapAsync from "../utils/tryCatchWrapper.js";


export const getPublicSiteSettings = wrapAsync( async(req,res) =>{
    const [rows] = await pool.query(`
            SELECT 
                id,settings,updated_at
            FROM site_settings
            WHERE id = 1
            LIMIT 1
        `)

    if(rows.length === 0){
        return res.status(404).json({
            success : false,
            message : "Site settings not found."
        })
    }

    let settings = rows[0].settings

    if(typeof settings === "string"){
        try{
            settings = JSON.parse(settings)
        }catch{
            settings= {}
        }
    }

    return res.status(200).json({
        success : true,
        settings : settings || {},
        updated_at : rows[0].updated_at
    })
})