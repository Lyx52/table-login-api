const jwt = require("jsonwebtoken");
const cryptoUtils = require("../utils/crypto.utils");
const db = require("../db/db");

const User = db.user;
const Role = db.role;
const Op = db.Sequelize.Op;
const secretCode = "1337_SECRET_CODE_1337";
exports.createAdministrator = async function() {
    let salt = cryptoUtils.randomString(32);

    let userData = {
        username: process.env.ADMIN_USERNAME,
        password: cryptoUtils.sha256(cryptoUtils.hashPassword(process.env.ADMIN_PASSWORD), salt),
        salt: salt
    };
    await User.create(userData)
        .then(user => {
            Role.findAll({
                where: {
                    name: {
                        [Op.or]: ['USER', 'MODERATOR', 'ADMIN']
                    }
                }
            }).then(roles => {
                user.setRoles(roles)
            });
        });
}
exports.register = (req, res) => {

    // Create password with salt pre applied
    let salt = cryptoUtils.randomString(32);
    // Save User to Database
    let userData = {
        username: req.body.username,
        password: cryptoUtils.sha256(req.body.password, salt),
        salt: salt
    };
    console.log(`REGISTED USER ${req.body.username} WITH PASSWORD ${userData.password}`)
    User.create(userData)
        .then(user => {
            if (req.body.roles) {
                Role.findAll({
                    where: {
                        name: {
                            [Op.or]: req.body.roles
                        }
                    }
                }).then(roles => {
                    user.setRoles(roles).then(() => {
                        res.send({ message: "User was registered successfully!" });
                    });
                });
            } else {
                user.setRoles([1]).then(() => {
                    res.status(200).send({ message: "User was registered successfully!" });
                });
            }
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

exports.login = (req, res) => {
    if (req.body.username && req.body.password) {
        User.findOne({
            where: {
                username: req.body.username
            }
        })
            .then(user => {
                if (!user) {
                    console.log(`Username not found`);
                    res.status(404).send({ fulfilled: false, message: "User not found!" });
                } else {

                    // Compare password
                    let passwordValid = cryptoUtils.compareHash(user.password, req.body.password, user.salt);
                    console.log(`LOGGING IN USER ${req.body.username} WITH PASSWORD ${req.body.password} PASSWORD VALID ${passwordValid}`)
                    if (!passwordValid) {
                        return res.status(401).send({
                            fulfilled: false,
                            accessToken: null,
                            message: "Invalid Password!"
                        });
                    }

                    // Generate access token
                    let authToken = jwt.sign({id: user.id}, secretCode, {
                        expiresIn: 86400 // 24 hours
                    });
                    console.log(`Generated token ${authToken}`);

                    // Make list of authorities user has
                    let authorities = [];
                    user.getRoles().then(roles => {
                        for (let i = 0; i < roles.length; i++) {
                            authorities.push(roles[i].name.toUpperCase());
                        }

                        if (process.env.env === "Development")
                            authorities.push("ADMIN");

                        let data = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            roles: authorities,
                            accessToken: authToken
                        };

                        res.status(200).send(data);
                    });
                }
            })
            .catch(err => {
                res.status(500).send({fulfilled: false, message: `Request failed with error: ${err}`});
            });
    } else res.status(400).send({fulfilled: false, message: "Malformed request!"})
};