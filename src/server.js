const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db/db");
const {initAuthRoutes} = require("./routes/auth.routes");
const {initUserRoutes} = require("./routes/user.routes");
const app = express();
const authController = require('./controllers/auth.controllers');
const mysql = require('mysql2/promise');
const fileUpload = require('express-fileupload');

const corsOptions = {
    orgin: process.env.ORGIN || "localhost:3000"
};
const Role = db.role;

mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASS
}).then(connection => {
    connection.query(`CREATE DATABASE IF NOT EXISTS ${db.db_config.DB};`).then(() => {
        db.sequelizer.sync({force: (process.env.FORCE_SYNC || false)}).then(() => {
            console.log('Drop and Re-sync Database');
            initRoles();
        });
    })
})
.catch(con_err => {
    console.log(con_err)
    process.exit(1)
})


// Setup express dependencies
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(fileUpload())
initAuthRoutes(app);
initUserRoutes(app);

// 404 Last route initialized
app.get('*', function(req, res){
    res.status(404);
    // respond with json
    res.send({ error: '404 Page not found!' });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});


async function initRoles() {
    // Create table columns
    Role.create({
        id: 1,
        name: "user"
    });
    Role.create({
        id: 2,
        name: "moderator"
    });
    Role.create({
        id: 3,
        name: "admin"
    });
    if (process.env.CREATE_ADMINISTRATOR)
        await authController.createAdministrator();
}