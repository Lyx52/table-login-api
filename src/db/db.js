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
            logging: config.logging,
            pool: {
                max: config.pool.max,
                min: config.pool.min,
                acquire: config.pool.acquire,
                idle: config.pool.idle
            }
        }
    ),
    db_config: config,
    Sequelize: Sequelize,
    ROLES: ["USER", "MODERATOR", "ADMIN"]
}

db.user = require("./models/user.model")(db.sequelizer, Sequelize);
db.role = require("./models/role.model")(db.sequelizer, Sequelize);
db.school = require("./models/school.model")(db.sequelizer, Sequelize);
db.athlete = require("./models/athlete.model")(db.sequelizer, Sequelize);

db.school.belongsToMany(db.athlete, {
    through: "athlete_schools",
    foreignKey: "schoolId",
    otherKey: "athleteId"
});
db.athlete.belongsToMany(db.school, {
    through: "athlete_schools",
    foreignKey: "athleteId",
    otherKey: "schoolId"
});


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
