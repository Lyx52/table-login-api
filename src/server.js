const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db/db");
const {initAuthRoutes} = require("./routes/auth.routes");
const {initUserRoutes} = require("./routes/user.routes");
const app = express();


const corsOptions = {
    orgin: "localhost:3000" //TODO: Change cors domain based off config!
};
const Role = db.role;

db.sequelizer.sync({force: true}).then(() => {
    console.log('Drop and Re-sync Database');
    initRoles();
});

// Setup express dependencies
app.use(cors(corsOptions));
app.use(bodyParser.json());

//TODO: Don't use separate functions from files for this! Instead make each requirement export an express router!
initAuthRoutes(app);
initUserRoutes(app);

// 404 Last route initialized
app.get('*', function(req, res){
    res.status(404);
    // respond with json
    res.send({ error: '404 Page not found!' }); //TODO: fullfilled:false, also maybe use res.json?
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

//TODO: Maybe move this to a separate file?
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