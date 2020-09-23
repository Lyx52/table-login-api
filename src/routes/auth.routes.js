const controllers = require("../controllers/auth.controllers");
const {checkRolesExisted, checkDUplicateUsername} = require("../middleware/auth.verify");
const initAuthRoutes = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/auth/register",
        [
            checkDUplicateUsername,
            checkRolesExisted
        ], controllers.register);

    app.post("/api/auth/login", controllers.login)
};

module.exports = {
    initAuthRoutes: initAuthRoutes
};