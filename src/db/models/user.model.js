// USER DATABASE MODEL
module.exports = (sequelizer, Sequelize) => {
    return sequelizer.define("users", {
        username: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        salt: {
            type: Sequelize.STRING
        }
    });
};