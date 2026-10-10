import session from "express-session";
import MYSQLStoreFactory from "express-mysql-session"

const MYSQLStore = MYSQLStoreFactory(session)

const sessionStore = new MYSQLStore({
    host : process.env.DB_HOST,
    port : Number(process.env.DB_PORT || 3306),
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,

    createDatabaseTable : true,
})

const sessionConfig = {
    name : process.env.SESSION_NAME || "krushisetu_admin_session",
    secret : process.env.SESSION_SECRET || "dummy-session-secret",

    store : sessionStore,
    
    resave : false,
    saveUninitialized : false,
    cookie : {
        httpOnly : true,
        secure : process.env.NODE_ENV === "production",
        sameSite : "lax",
        maxAge : Number(process.env.SESSION_MAX_AGE || 8 * 60 * 60 * 1000),

    },
}

export default sessionConfig