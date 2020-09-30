module.exports = {
    HOST: "localhost",
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASS,
    DB: process.env.DB_NAME || "OTableSite",
    dialect: "mysql",
    logging: true,
    pool: {
        max: 3,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};