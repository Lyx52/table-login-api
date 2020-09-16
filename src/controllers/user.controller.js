const db = require("../db/db");
const {QueryTypes} = require("sequelize");
const tables = ['jauniesi', 'jaunietes', 'skolas'];
exports.isAdmin = (req, res) => {
    res.status(200).json({fulfilled: true, type: "admin"})
};
exports.isModerator = (req, res) => {
    res.status(200).json({fulfilled: true, type: "moderator"})
};

exports.setTable = async (req, res) => {
    console.log(req.body);

    let tableName = "";
    if (req.body.tableID) {
        tableName = tables[Math.min(Math.max(parseInt(req.body.tableID), 0), tables.length - 1)];
        if (req.body.changedData) {
            await fulfillPromiseArray(buildRowPromises(tableName, req.body.changedData))
        }
        await res.status(200).json({fulfilled: true, message: "Rows updated successfully!"})
    }
};


exports.getTable = (req, res) => {
    console.log("TABLE REQUEST");
    if (req.body.tableID) {

        // Parse query to integer
        let parsedTableID = 0;
        try {
            parsedTableID = parseInt(req.body.tableID)
        } catch (parsingError) {
            res.status(400).json({fulfilled: false, message: parsingError}); //TODO: Error handler should handle this!!
        }

        // Limit table id to tables array range
        let tableID = Math.min(Math.max(parsedTableID, 0), tables.length - 1);
        if (req.body.runNr) {

            // Parse query to integer
            let parsedRunNr = 0;
            try {
                parsedRunNr = parseInt(req.body.runNr)
            } catch (parsingError) {
                res.status(400).json({fulfilled: false, message: parsingError}); //TODO: Error handler should handle this!!
            }

            //TODO: Yeah... nah. We should use the DB models for this!
            let query = `SELECT ID, VardsUzvards, DalibniekaNr, SkrejienaNr, Rezultats, MacibuIestade, DzimsanasGads FROM ${tables[tableID]} WHERE SkrejienaNr = ${parsedRunNr};`;
            db.sequelizer
                .query(query, {type: QueryTypes.SELECT })
                .then(response => {
                    let reqResponse = [];
                        for (let index = 0; index < response.length; index++) {
                            reqResponse.push({
                                name: response[index].VardsUzvards,
                                school: response[index].MacibuIestade,
                                athleteNr: response[index].DalibniekaNr,
                                runNr: response[index].SkrejienaNr,
                                result: response[index].Rezultats
                            });
                        }
                        res.status(200).json({fulfilled: true, data: reqResponse});
                })
                .catch(error => {
                    res.status(400).json({fulfilled: false, message: error}) //TODO: Error handler should handle this!!
                });
        } else res.status(404).json({fulfilled: false, message: "Invalid run number!"}); //TODO: Error handler should handle this!!
    } else res.status(404).json({fulfilled: false, message: "Invalid table id!"}); //TODO: Error handler should handle this!!
};

async function fulfillPromiseArray(promises) {
    await Promise.all(promises)
        .then(response => {
            console.log(response)
        })
        .catch(error => {
            console.log(`Updating rows caused an error: ${error}`) //TODO: Error handler should handle this!!
        })
        .finally(() => {});
}

function buildRowPromises(tableName, dataArray) {
    return dataArray.map((dict) =>
        Promise.resolve().then(() => updateResult(tableName, dict["runNr"], dict["athleteNr"], dict["result"]))
    );
}

const updateResult = async function(tableName, runNr, athleteNr, result) {
    // Parse athlete number to integer
    if (athleteNr)
        try {
            athleteNr = parseInt(athleteNr);
        } catch (parsingException) {
            return new Promise((reject) => reject(`Invalid athleteNr: ${athleteNr}`)) //TODO: Error handler should handle this!!
        }

    // parse run number to integer
    if (runNr)
        try {
            runNr = parseInt(runNr);
        } catch (parsingException) {
            return new Promise((reject) => reject(`Invalid runNr: ${runNr}`)) //TODO: Error handler should handle this!!
        }
    let query = `UPDATE ${tableName.toString()} SET Rezultats = ${result} WHERE DalibniekaNr = ${athleteNr} AND SkrejienaNr = ${runNr};`; 
    return await db.sequelizer.query(query)
};
