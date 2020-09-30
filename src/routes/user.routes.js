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

    /* TABLE EDIT/REMOVE/VIEW/UPDATE */
    app.post("/api/get/table", controller.getTable);

    app.post("/api/set/table",
        [verifyToken, isAdminOrModerator],
        controller.saveTable
    );
    app.post("/api/delete/table",
         [verifyToken, isAdminOrModerator],
        controller.deleteRows
    );
    app.post("/api/insert/table",
        [verifyToken, isAdminOrModerator],
        controller.insertRow
    );

    /* DASHBOARD SCHOOL TAB */
    app.post("/api/insert/school",
        [verifyToken, isAdmin],
        controller.insertSchool
    );
    app.get("/api/get/schools",
        controller.getSchools
    );
    app.post("/api/delete/schools",
        [verifyToken, isAdmin],
        controller.deleteSchools
    );

    /* FILE UPLOAD/DOWNLOAD */
    app.post("/api/upload/table",
        [verifyToken, isAdmin],
        controller.importTableXLSX
    );
    app.post("/api/download/table",
        [verifyToken, isAdminOrModerator],
        controller.downloadTableXLSX
    );

    /* RESULT TABLE */
    app.post("/api/get/results",
        controller.getSchoolResults
    );
};
module.exports = {
    initUserRoutes: initUserRoutes
};