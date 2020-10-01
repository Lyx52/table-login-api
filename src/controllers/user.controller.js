const db = require("../db/db");
const table = ['jauniesi', 'jaunietes', 'skolas'];
const School = db.school;
const Athlete = db.athlete;
const xlsx = require('node-xlsx');
const time = require('../utils/time.utils')
const {Op} = require('sequelize')

const header_translation = {
    'Nr. krosā': 'athleteNr',
    'Skrējiena Nr.': 'runNr',
    'Vārds, Uzvārds': 'name',
    'Dz. gads': 'year',
    'Skola': 'schoolID',
    'Rezultāts': 'result'
}

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
    Athlete.findAll({})
        .then(r => {
            for (let i = 0; i < r.length; i++)
                console.log(r[i].dataValues);
        })
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

exports.importTableXLSX = (req, res) => {
    if (req.files.file.data) {
        let file = req.files.file;
        const worksheet = xlsx.parse(file.data)
        for (let i = 0; i < worksheet.length; i++) {
            let name = worksheet[i].name

            if (name === 'jaunietes_nekartot' || name === 'jauniesi_nekartot') {

                // Which table to insert into
                let gender = name.replace('_nekartot', '');

                // Whole worksheet
                let worksheet_data = worksheet[i].data

                // Header of table
                let header = worksheet_data[5].map(item => {
                    return header_translation[item]
                })

                // Field data
                let data = worksheet_data.filter(item => worksheet_data.indexOf(item) > 5 && item.length > 4)
                let schoolNameIndex = header.indexOf('schoolID')
                let schoolPromises = data.map(item => Promise.resolve().then(() => createSchool(item[schoolNameIndex])));

                let schoolData = []
                fulfillPromiseArray(schoolPromises).finally(async () => {
                    let athleteData = []
                    await School.findAll({})
                        .then(response => {
                            schoolData = response.map(item => item.dataValues)
                            athleteData = data.map(item => {
                                let school = schoolData.filter(school => {
                                    return school.name === item[schoolNameIndex]
                                })
                                let schoolID = school.length > 0 ? school[0].schoolID : 0;

                                let result = item.length > 4 && item[header.indexOf('result')] ? parseInt(parseFloat(item[header.indexOf('result')]) * 86400000) : 0;
                                if (item[header.indexOf('name')]) {
                                    let data = {
                                        'athleteNr': item[header.indexOf('athleteNr')],
                                        'runNr': item[header.indexOf('runNr')],
                                        'name': item[header.indexOf('name')],
                                        'year': item[header.indexOf('year')],
                                        'schoolID': schoolID,
                                        'gender': gender,
                                        'result': result
                                    };
                                    return data;
                                }
                            })
                        })
                        .finally(async () => {
                            await fulfillPromiseArray(athleteData.map(item => Promise.resolve().then(() => createAthlete(item))))
                                .finally(() => {
                                    res.status(200).json({fulfilled: true, message: "Successfuly imported table!"})
                                })
                        })
                })
            }
        }
    } else res.status(400).json({fulfilled: false, message: "Invalid upload!"})
}

createAthlete = async function(athleteData) {
    return await Athlete.create(athleteData);
}

createSchool = async function(schoolName) {
    if (schoolName) {
        return await School.create({name: schoolName}, {
            where: {
                [Op.and]: {
                    name: {
                        [Op.not]: schoolName
                    }
                }
            }
        })
    }
}

exports.downloadTableXLSX = async (req, res) => {
    let outputTable = []
    let searchBy = parseInt(req.body.genderID) >= 0 ? { where: { gender: table[req.body.genderID] } } : {};
    const options = {'!cols': []};
    switch (parseInt(req.body.tableID)) {
        case 0: {
            outputTable.push(['Vārds  Uzvārds', 'Izglītības iestāde', 'Starta Nr.', 'Dzimums', 'Rezultāts'])
            await School.findAll({})
                .then(async (schoolList) => {
                    await Athlete.findAll(searchBy)
                        .then(response => {
                            for (let index = 0; index < response.length; index++) {
                                // Get result row data
                                let result = response[index].dataValues;

                                // Get school name from result row schoolID
                                let schoolName = schoolList.filter(item => item.schoolID === result.schoolID)[0].dataValues.name

                                // Add row to array
                                let outputArray = [result.name, schoolName, result.runNr, result.gender === 'jauniesi' ? 'jaunietis' : 'jauniete']

                                // If result > 0 add formatted result
                                if (result.result)
                                    outputArray.push(time.fromMilliseconds(result.result))

                                outputTable.push(outputArray)
                            }
                        })
                        .catch(error => res.status(400).json({fulfilled: false, message: "Invalid table"}))
                })
                .catch(err => {
                    res.status(400).json({fulfilled: false, message: "Could not find school list"})
                })
            options["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }]
        } break;
        case 1: {
            outputTable.push(['Skola', 'Skolas rezultāts'])

            await createResultTable(searchBy)
                .then(response =>{
                    for (let index = 0; index < response.data.length; index++) {
                        let result = response.data[index];
                        outputTable.push([result.schoolName, time.fromMilliseconds(result.schoolResult)])
                    }
                })
                .catch(error => res.status(400).json({fulfilled: false, message: "Invalid table"}))
            options["!cols"] = [{ wch: 30 }, { wch: 15 }]
        } break;
    }

    //Excel file buffer
    let buffer = xlsx.build([{name: "Rezultāti", data: outputTable}], options);

    // Save temp file
    const fs = require("fs");
    fs.writeFile('./temp.xlsx', buffer, () => {
        res.status(200).download('./temp.xlsx')
    })
}
exports.insertRow = (req, res) => {
    if (req.body.rowData && req.body.tableID > -1) {
        let data = req.body.rowData;
        data.gender = table[req.body.tableID]
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
    return await Promise.all(promises)
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
            athleteNr: Math.abs(data.athleteNr),
            runNr: Math.abs(data.runNr),
            result: Math.abs(data.result),
            schoolID: Math.abs(data.schoolID)
        },
        {
            where: {
                id: data.id
            }
        })
};

exports.getSchoolResults = async (req, res) => {
    let searchBy = parseInt(req.body.tableID) >= 0 ? { where: { gender: table[req.body.tableID] } } : {};
    if (searchBy) {
        await createResultTable(searchBy)
            .then(response => {
                res.status(200).json(response)
            })
            .catch(err => {
                console.log(err)
                res.status(400).json(err)
            })
    } else {
        res.status(400).json({fulfilled: false, message: "Malformed request!"})
    }
}

function createResultTable(searchBy) {
    let schoolData, athleteData, resultData = [];
    return new Promise((resolve, reject) => {
        School.findAll({})
            .then(response => {
                schoolData = response.map(item => item.dataValues)
                console.log(schoolData)
                Athlete.findAll(searchBy)
                    .then(async (response) => {
                        for (let schoolIndex = 0; schoolIndex < schoolData.length; schoolIndex++) {
                            // School id
                            let schoolID = schoolData[schoolIndex].schoolID
                            let schoolName = schoolData[schoolIndex].name

                            // Get athlete data from athlete model instance data and filter it by schoolid
                            athleteData = (response.map(item => item.dataValues)).filter(item => item.schoolID ? item.schoolID === schoolID : false)
                            // If athlete data exists, then calculate result of it
                            if (athleteData.length > 0) {
                                resultData.push(calculateResult(athleteData, schoolID, schoolName));
                            }
                            // If current schoolID is last in array send response
                            if (schoolIndex === schoolData.length - 1) {
                                resolve({fulfilled: true, data: resultData});
                            }
                        }

                    })
                    .catch(err => {
                        reject({fulfilled: false, message: "Athlete list not found!"});
                    })
            })
            .catch(err => {
                reject({fulfilled: false, message: "Athlete list not found!"});
            })
    })
}

function calculateResult(combinedTable, schoolID, schoolName) {
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
        return {schoolID: schoolID, schoolName: schoolName, schoolResult: sum}
    } else return {schoolID: schoolID, schoolName: schoolName, schoolResult: 0};
}