const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db/db");
const {initAuthRoutes} = require("./routes/auth.routes");
const {initUserRoutes} = require("./routes/user.routes");
const app = express();


const corsOptions = {
    orgin: "localhost:3000"
};
const Role = db.role;

db.sequelizer.sync({force: true}).then(() => {
    console.log('Drop and Re-sync Database');
    initRoles();
});

// Setup express dependencies
app.use(cors(corsOptions));
app.use(bodyParser.json());

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


function initRoles() {
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
}