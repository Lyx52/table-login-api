const db = require("../db/db");
const dateTime = require("date-and-time");
const escapeString = require('sql-string-escape');
const {QueryTypes} = require("sequelize");
const tables = ['jauniesi', 'jaunietes', 'skolas'];

exports.isAdmin = (req, res) => {
    res.status(200).json({fulfilled: true, type: "admin"})
};
exports.isModerator = (req, res) => {
    res.status(200).json({fulfilled: true, type: "moderator"})
};

exports.setTable = async (req, res) => {
    // TODO: Note to myself something is messing up with saving data, results dont get correctly saved!
    let data = req.body.changedData;

    let tableName = "";
    if (req.body.tableID) {
        tableName = tables[Math.min(Math.max(parseInt(req.body.tableID), 0), tables.length - 1)];
        if (data) {
            await fulfillPromiseArray(buildPromiseArray(tableName, data, updateResult))
        }
        await res.status(200).json({fulfilled: true, message: "Rows updated successfully!"})
    }
};
exports.getTable = (req, res) => {
    console.log("TABLE REQUEST");
    if (req.body.tableID) {
        console.log(req.body);
        // Parse query to integer
        let parsedTableID = 0;
        try {
            parsedTableID = parseInt(req.body.tableID)
        } catch (parsingError) {
            res.status(400).json({fulfilled: false, message: parsingError});
        }

        // Limit table id to tables array range
        let tableID = Math.min(Math.max(parsedTableID, 0), tables.length - 1);
        if (req.body.runNr) {

            // Parse query to integer
            let parsedRunNr = 0;
            try {
                parsedRunNr = parseInt(req.body.runNr)
            } catch (parsingError) {
                res.status(400).json({fulfilled: false, message: parsingError});
            }
            let query = `SELECT ID, VardsUzvards, DalibniekaNr, SkrejienaNr, Rezultats, SchoolID, DzimsanasGads FROM ${tables[tableID]}`;
            query += parsedRunNr > 0 ? ` WHERE SkrejienaNr = ${parsedRunNr};` : ";";
            console.log(query);
            db.sequelizer
                .query(query, {type: QueryTypes.SELECT })
                .then(response => {
                    let reqResponse = [];
                        for (let index = 0; index < response.length; index++) {
                            reqResponse.push({
                                name: response[index].VardsUzvards,
                                school: response[index].SchoolID,
                                athleteNr: response[index].DalibniekaNr,
                                runNr: response[index].SkrejienaNr,
                                result: response[index].Rezultats,
                                birthyear: response[index].DzimsanasGads
                            });
                        }
                        res.status(200).json({fulfilled: true, data: reqResponse});
                })
                .catch(error => {
                    res.status(400).json({fulfilled: false, message: error})
                });
        } else res.status(404).json({fulfilled: false, message: "Invalid run number!"});
    } else res.status(404).json({fulfilled: false, message: "Invalid table id!"});
};

exports.deleteRows = (req, res) => {
    // TODO: Improve...
    let tableID = null;
    try {
        tableID = parseInt(req.body.tableID);
    } catch (parsingException) {
        console.error("Could not parse tableID!")
    }

    let dataArray = req.body.deleteData;
    console.log(dataArray)
    let runNrArray = [];
    let athleteNrArray = [];

    if (dataArray) {
        athleteNrArray = dataArray.map(item => parseInt(item['athleteNr']));
        runNrArray = dataArray.map(item => parseInt(item['runNr']));
    }

    if (tableID !== null && runNrArray.length > 0 && athleteNrArray.length > 0) {
        let query = `DELETE FROM ${tables[tableID]} WHERE DalibniekaNr IN (${athleteNrArray}) AND SkrejienaNr IN (${runNrArray});`;
        console.log(query);
        db.sequelizer.query(query)
            .then(response => {
                res.status(200).json({fulfilled: true, message: "Successfuly deleted rows!"})
            })
            .catch(error => {
                res.status(400).json({fulfilled: true, message: error})
            });
    } else res.status(400).json({fulfilled: false, message: "Invalid request!"})
};
exports.insertSchool = async(req, res) => {
    let schoolName = req.body.schoolName;
    if (schoolName) {
        db.sequelizer.query(`INSERT INTO skolas (SchoolName, SchoolName_2) VALUES (${escapeString(schoolName)}, ${escapeString(schoolName)});`)
            .then(response => {
                res.status(200).json({fulfilled: true, message: "Successfuly added school!"})
            })
            .catch(error => {
                console.log(error)
                res.status(400).json({fulfilled: true, message: `Request failed with error: ${error}`})
            });
    } else res.status(400).json({fulfilled: false, message: "Invalid request!"})
};
exports.getSchools = async (req, res) =>{
    db.sequelizer.query(`SELECT SchoolID, SchoolName FROM skolas`)
        .then(response => {
            res.status(200).json(response)
        })
        .catch(error => {
            console.log(error);
            res.status(404).json({fulfilled: false, message: "Could not find any school names!"});
        })
};
exports.deleteSchools = async(req, res) => {
    let dataArray = req.body.schools;
    console.log(dataArray);
    let idArray = dataArray.map(item => parseInt(item.SchoolID));
    let nameArray = dataArray.map(item => escapeString(item.SchoolName));
    if (idArray.length > 0 && nameArray.length > 0) {
        let query = `DELETE FROM skolas WHERE SchoolID IN (${idArray}) AND SchoolName IN (${nameArray});`;
        console.log(query);
        db.sequelizer.query(query)
            .then(response => {
                // Get current row count and set auto increment to row count + 1
                db.sequelizer.query(`SELECT COUNT(*) FROM skolas;`)
                    .then(response => {
                        db.sequelizer.query(`ALTER TABLE skolas AUTO_INCREMENT = ${response[0][0]['COUNT(*)'] + 1};`)
                    });

                // Respond
                res.status(200).json({fulfilled: true, message: "Successfuly deleted schools!"})
            })
            .catch(error => {
                console.log(error)
                res.status(400).json({fulfilled: true, message: error})
            });
    } else res.status(400).json({fulfilled: false, message: "Empty request!"})
};

exports.getSchoolResults = async (req, res) => {
    let schoolData, maleTable, femaleTable, resultList = [];

    // First step getting data off database!
    // Get school table
    await db.sequelizer.query(`SELECT SchoolID, SchoolName FROM skolas;`)
        .then(response => {
            schoolData = response[0];

            // Get male table
            db.sequelizer.query(`SELECT SchoolID, Rezultats, DalibniekaNr FROM jauniesi;`)
                .then(response => {
                    maleTable = response[0];

                    // Get female table
                    db.sequelizer.query(`SELECT SchoolID, Rezultats, DalibniekaNr FROM jaunietes;`)
                        .then(response => {
                            femaleTable = response[0];

                            // TODO: Implemet better timestamp calculation, current conversion is intensive.

                            // Start calculating data
                            for (let schoolIndex = 0; schoolIndex < schoolData.length; schoolIndex++) {
                                // Get school ID
                                let schoolID = schoolData[schoolIndex].SchoolID;

                                // Filter female/male athletes from that school
                                let femaleAthletes = femaleTable.filter(item => item.SchoolID ? item.SchoolID === schoolID : false);
                                let maleAthletes = maleTable.filter(item => item.SchoolID ? item.SchoolID === schoolID : false);
                                // Combine lists
                                let combinedTable = femaleAthletes.concat(maleAthletes);
                                resultList.push(calculateResult(combinedTable, schoolID));

                                if (schoolIndex === schoolData.length - 1)
                                    res.status(200).json(resultList)
                            }
                        })
                        .catch(error => {
                            res.status(404).json({fulfilled: false, message: "Could not find female table data!"});
                            console.log(error)
                        });
                })
                .catch(error => {
                    res.status(404).json({fulfilled: false, message: "Could not find male table data!"});
                    console.log(error)
                });
        })
        .catch(error => {
            res.status(404).json({fulfilled: false, message: "Could not find school data!"});
            console.log(error)
        });
};
exports.insertRows = async (req, res) => {
    let data = req.body.rowData;

    let tableName = "";
    console.log(data, req.body.tableID)
    if (req.body.tableID) {
        tableName = tables[Math.min(Math.max(parseInt(req.body.tableID), 0), tables.length - 1)];
        console.log(tableName)
        if (data) {
            await insertRow(tableName, data.name, data.school, data.birthyear, data.runNr, data.athleteNr, data.result)
        } else res.status(400).json({fulfilled: false, message: "Invalid request data!"});
        res.status(200).json({fulfilled: true, message: "Rows inserted successfully!"})
    }
};
async function fulfillPromiseArray(promises) {
    await Promise.all(promises)
        .then(response => {
            console.log(response)
        })
        .catch(error => {
            console.log(`Updating rows caused an error: ${error}`)
        })
        .finally(() => {});
}

function buildPromiseArray(tableName, dataArray, func) {
    return dataArray.map((dict) =>
        Promise.resolve().then(() => func(tableName, dict["name"], dict["school"], dict['runNr'], dict["athleteNr"], dict['result']))
    );
}


const updateResult = async function(tableName, name, school, runNr, athleteNr, result) {
    //TODO: IMPLEMENT MONGODB...
    let query = `UPDATE ${tableName.toString()} SET VardsUzvards = ${escapeString(name)}, SchoolID = ${parseInt(school)}, SkrejienaNr = ${parseInt(runNr)}, Rezultats = ${escapeString(result)}, DalibniekaNr = ${parseInt(athleteNr)} WHERE DalibniekaNr = ${parseInt(athleteNr)} AND SkrejienaNr = ${parseInt(runNr)};`;
    return await db.sequelizer.query(query)
};

const insertRow = async function(tableName, name, school, birthyear, runNr, athleteNr, result) {
    console.log(result)
    let query = `INSERT INTO ${tableName.toString()} (ID, VardsUzvards, SchoolID, SkrejienaNr, DalibniekaNr, Rezultats, DzimsanasGads) VALUES (${parseInt(athleteNr)}, ${escapeString(name)}, ${parseInt(school)}, ${parseInt(runNr)}, ${parseInt(athleteNr)}, ${escapeString(result)}, ${parseInt(birthyear)});`;
    return await db.sequelizer.query(query)
};

function calculateResult(combinedTable, schoolID) {
    if (combinedTable && combinedTable.length >= 6) {

        // Convert time to ms
        combinedTable = combinedTable.map(item => {
            return timeToMs(item.Rezultats)
        });

        // Sort by result
        combinedTable.sort((a, b) => {
            return a - b
        });
        // Remove last 2
        combinedTable = combinedTable.slice(0, 6);

        // Calculate sum of array
        let sum = combinedTable.reduce(function(a, b){
            return a + b;
        }, 0);

        // Convert it to timestamp and return
        return {SchoolID: schoolID, SchoolResult: (dateTime.format(new Date(sum), "m:s:SSS")).toString()}
    } else return {SchoolID: schoolID, SchoolResult: '0'};
}
function timeToMs(result) {
    let time = dateTime.parse(result, "m:s:SSS");
    return time ? (time.getMinutes() * 60000) + (time.getSeconds() * 1000) + time.getMilliseconds() : 0;
}