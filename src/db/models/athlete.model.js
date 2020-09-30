//ATHLETE DATABASE MODEL
module.exports = (sequelize, Sequelize) => {
    return sequelize.define("athletes", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        gender: {
            type: Sequelize.STRING
        },
        name: {
            type: Sequelize.STRING
        },
        year: {
            type: Sequelize.INTEGER(4)
        },
        athleteNr : {
            type: Sequelize.INTEGER
        },
        runNr: {
            type: Sequelize.INTEGER
        },
        result: {
            type: Sequelize.INTEGER
        },
        schoolID: {
            type: Sequelize.INTEGER
        }
    });
};