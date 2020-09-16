const { Sequelize} = require("sequelize");
const config = require("./db.config");
const db = {
    sequelizer: new Sequelize(
        config.DB,
        config.USER,
        config.PASSWORD,
        {
            host: config.HOST,
            dialect: config.dialect,
            operatorsAliases: false,

            pool: {
                max: config.pool.max,
                min: config.pool.min,
                acquire: config.pool.acquire,
                idle: config.pool.idle
            }
        }
    ),
    Sequelize: Sequelize,
    ROLES: ["USER", "MODERATOR", "ADMIN"] //TODO: Make this configurable?
};
db.user = require("./models/user.model")(db.sequelizer, Sequelize);
db.role = require("./models/role.model")(db.sequelizer, Sequelize);


db.role.belongsToMany(db.user, {
    through: "user_roles",
    foreignKey: "roleId",
    otherKey: "userId"
});
db.user.belongsToMany(db.role, {
    through: "user_roles",
    foreignKey: "userId",
    otherKey: "roleId"
});


module.exports = db;
