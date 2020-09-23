const jwt = require("jsonwebtoken");
const db = require("../db/db");
const User = db.user;
const secretCode = "1337_SECRET_CODE_1337";

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    console.log(token)
    if (!token) {
        return res.status(403).send({
            fulfilled: false,
            message: "No token provided!"
        });
    }
    jwt.verify(token, secretCode, (err, decoded) => {
        console.log(`TOKEN ${token} WITH SECRET CODE ${secretCode}`)
        if (err) {
            return res.status(401).send({
                fulfilled: false,
                message: "Unauthorized!"
            });
        }
        req.userId = decoded.id;
        next();
    });
};

isAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "admin") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                fulfilled: false,
                message: "Require Admin Role!"
            });
        });
    });
};

isAdminOrModerator = (req, res, next) => {

    User.findByPk(req.userId).then(user => {
        user.getRoles()
            .then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "moderator") {
                    next();
                    return;
                }

                if (roles[i].name === "admin") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                fulfilled: false,
                message: "Require Moderator or Admin Role!"
            });
        });
    });
};

module.exports = {
    verifyToken: verifyToken,
    isAdminOrModerator: isAdminOrModerator,
    isAdmin: isAdmin
};