//SCHOOL DATABASE MODEL
module.exports = (sequelize, Sequelize) => {
    return sequelize.define("schools", {
        schoolID: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            unique: true
        }
    });
};