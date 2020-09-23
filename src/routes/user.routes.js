const controller = require("../controllers/user.controller");
const {verifyToken, isAdminOrModerator, isAdmin} = require("../middleware/auth.jwt");
const initUserRoutes = function(app) {

    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Test if user is a mod
    app.get(
        "/api/test/mod",
        [verifyToken, isAdminOrModerator],
        controller.isModerator
    );

    // Test if user is an admin
    app.get(
        "/api/test/admin",
        [verifyToken, isAdmin],
        controller.isAdmin
    );

    // Get public table view
    app.post("/api/get/table", controller.getTable);

    // Update table
    app.post("/api/set/table",
        [verifyToken, isAdminOrModerator],
        controller.setTable
    );
    app.post("/api/delete/table",
         [verifyToken, isAdminOrModerator],
        controller.deleteRows
    );
    app.post("/api/insert/table",
        [verifyToken, isAdminOrModerator],
        controller.insertRows
    );
    app.post("/api/insert/school",
        [verifyToken, isAdmin],
        controller.insertSchool
    );
    app.get("/api/get/school",
        controller.getSchools
    );
    app.post("/api/delete/school",
        [verifyToken, isAdmin],
        controller.deleteSchools
    );
    app.get("/api/get/results",
        [verifyToken, isAdminOrModerator],
        controller.getSchoolResults
    );
};
module.exports = {
    initUserRoutes: initUserRoutes
};