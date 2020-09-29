const db = require("../db/db");
const table = ['male', 'female', 'skolas'];
const School = db.school;
const Athlete = db.athlete;

exports.deleteRows = (req, res) => {
    if (req.body.rows) {
        console.log(req.body.rows)
       Athlete.destroy({
           where: {
               id: req.body.rows
           }
       })
        .then(response => {
            res.status(200).json({fulfilled: true, message: "Successfuly deleted rows!"})
        })
        .catch(error => {
            res.status(400).json({fulfilled: false, message: error})
        });
    } else res.status(400).json({fulfilled: false, message: "Malformed request!"})
};

exports.saveTable = async (req, res) => {
    if (req.body.tableData) {
        let idList = req.body.tableData.map(item => item.id) || 0
        await Athlete.findAll({
            where: {
                id: idList
            }
        })
            .then(async (response) => {
                // TODO: Implement instance updating
                await fulfillPromiseArray(buildPromiseArray(req.body.tableData, updateResult))
                    .finally(() => res.status(200).json({fulfilled: true, message: "Successfully updated rows!"}))
            })
            .catch(err => {
                res.status(500).json({fulfilled: false, message: err.message})
            })
    } else res.status(400).json({fulfilled: false, message: "Malformed request!"})
}

exports.getTable = (req, res) => {
    if (req.body.tableID || req.body.runNr && req.body.tableID) {
        let query = {
            where: {
                gender: table[req.body.tableID]
            }
        }

        if (req.body.runNr > 0)
            query.where.runNr = req.body.runNr;

        Athlete.findAll(query)
            .then(response => {
                res.status(200).json({fulfilled: true, data: response})
            })
            .catch(err => {
                res.status(500).send({fulfilled: false, message: `Request failed with error: ${err}`});
            });
    } else res.status(400).send({fulfilled: false, message: "Malformed request!"})
}
exports.getTableXLSX = (req, res) => {
    if (req.body.tableID || req.body.runNr && req.body.tableID) {
        let query = {
            where: {
                gender: table[req.body.tableID]
            }
        }

        if (req.body.runNr > 0)
            query.where.runNr = req.body.runNr;

        Athlete.findAll(query)
            .then(response => {
                res.status(200).json({fulfilled: true, data: response})
            })
            .catch(err => {
                res.status(500).send({fulfilled: false, message: `Request failed with error: ${err}`});
            });
    } else res.status(400).send({fulfilled: false, message: "Malformed request!"})
}
exports.insertRow = (req, res) => {
    if (req.body.rowData && req.body.tableID) {
        let data = req.body.rowData;
        data.gender = table[req.body.tableID]
        console.log(data)
        Athlete.create(data)
            .then(response => {
                if (response)
                    res.status(200).send({ fulfilled: true, message: "Successfully inserted row" });
            })
            .catch(err => {
                res.status(500).send({ fulfilled: false, message: err.message });
            })
    } else res.status(400).send({fulfilled: false, message: "Malformed request!"})
}

exports.insertSchool = async (req, res) => {
    if (req.body.schoolName) {
        await School.create({
            name: req.body.schoolName
        })
        .then(response => {
            if (response)
                res.status(200).json({fulfilled: true, message: "Successfuly added school!"})
        })
        .catch(err => {
            res.status(500).json({fulfilled: false, message: err.message})
        })
    } else res.status(400).json({fulfilled: false, message: "Malformed request!"})
}

exports.getSchools = async (req, res) => {
    await School.findAll({})
        .then(response => {
            res.status(200).json({fulfilled: true, message: "Successfuly recieved schools!", data: response})
        })
        .catch(err => {
            res.status(500).json({fulfilled: false, message: err.message});
        })
}

exports.deleteSchools = async (req, res) => {
    if (req.body.schools) {
        await School.destroy({
            where: {
                schoolID: req.body.schools
            }
        })
        .then(response => {
            if (response)
                res.status(200).json({fulfilled: true, message: "Successfuly deleted schools!"})
        })
        .catch(err => {
            res.status(500).json({fulfilled: false, message: err.message})
        })
    } else res.status(400).json({fulfilled: false, message: "Malformed request!"})
}

async function fulfillPromiseArray(promises) {
    await Promise.all(promises)
        .catch(error => {
            console.log(`Updating rows caused an error: ${error}`)
        })
        .finally(() => {});
}

function buildPromiseArray(data, func) {
    return data.map((item) =>
        Promise.resolve().then(() => func(item))
    );
}


const updateResult = async function(data) {
    return await Athlete.update(
        {
            name: data.name,
            year: data.year,
            athleteNr: data.athleteNr,
            runNr: data.runNr,
            result: data.result,
            schoolID: data.schoolID
        },
        {
            where: {
                id: data.id
            }
        })
};

exports.getSchoolResults = async (req, res) => {
    let schoolData, athleteData, resultData = [];
    let searchBy = parseInt(req.body.tableID) >= 0 ? { where: { gender: table[req.body.tableID] } } : {};

    if (searchBy) {
        await School.findAll({})
            .then(response => {
                schoolData = response.map(item => item.dataValues)
                Athlete.findAll(searchBy)
                    .then(response => {
                        for (let schoolIndex = 0; schoolIndex < schoolData.length; schoolIndex++) {
                            // School id
                            let schoolID = schoolData[schoolIndex].schoolID

                            // Get athlete data from athlete model instance data and filter it by schoolid
                            athleteData = (response.map(item => item.dataValues)).filter(item => item.schoolID ? item.schoolID === schoolID : false)

                            // If athlete data exists, then calculate result of it
                            if (athleteData) {
                                resultData.push(calculateResult(athleteData, schoolID));
                            }

                            // If current schoolID is last in array send response
                            if (schoolIndex === schoolData.length - 1) {
                                res.status(200).json({fulfilled: true, data: resultData})
                            }
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(500).json({fulfilled: false, message: "Athlete list not found!"})
                    })
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({fulfilled: false, message: "School list not found!"})
            })
    } else {
        res.status(400).json({fulfilled: false, message: "Malformed request!"})
    }
}

function calculateResult(combinedTable, schoolID) {
    combinedTable = combinedTable.filter(item => !item || item.result !== 0);
    if (combinedTable && combinedTable.length >= 6) {
        // Get result out of table data
        combinedTable = combinedTable.map(item => {
            return item.result
        });
        // Sort by result
        combinedTable.sort((a, b) => {
            return a - b
        });

        // Remove last 2
        combinedTable = combinedTable.slice(0, 6);

        // Calculate sum of array
        let sum = combinedTable.reduce(function (a, b) {
            return a + b;
        }, 0);
        // Convert it to timestamp and return
        return {schoolID: schoolID, schoolResult: sum}
    } else return {schoolID: schoolID, schoolResult: 0};
}