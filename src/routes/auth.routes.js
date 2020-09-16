const controllers = require("../controllers/auth.controllers");
const {checkRolesExisted, checkDuplicateUsernameOrEmail} = require("../middleware/auth.verify");
const initAuthRoutes = function(app) {
    app.use(function(req, res, next) {
        // TODO: Headers should not be set in route use a middleware instead!
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post("/api/auth/register",
        [
            checkDuplicateUsernameOrEmail,
            checkRolesExisted
        ], controllers.register);

    app.post("/api/auth/login", controllers.login)
};

module.exports = {
    initAuthRoutes: initAuthRoutes
};