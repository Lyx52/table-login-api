# OTrack-API

REST CRUD API for storing/saving track times for athletic runs. Custom made for [OVT](http://ovt.lv)'s track and field events.

## About
This project is the backend service for a much-needed paper sheet scoring replacement. 
It should simplify the result tallying and data entry process, as well as data access by providing a WEB UI for entry/ viewing/ coordinating. 
It provides:
* User authentication via JWT
* Track time data CRUD functionality

_Currently the project is in an extremely early, prototype state. Expect bugs and/or missing functionality._

## Getting Started

This project is built with [node.js](https://nodejs.org/), [Express](https://expressjs.com) and [MariaDB](https://mariadb.org).

All requirements can be installed by running `npm install` in the repository root folder, or by using the docker compose files.
### Prerequisites
Your system needs to have node.js _(duh)_ and npm installed. 
A mariaDB server with an empty database (with read, write and delete privileges) is required as well.

All the DB configuration can be done in [`/src/db/db.config.js`](/src/db/db.config.js).  

If you are using the docker version, all the configuration can be done through environment vars.
### Installing


#### Installing manually
Clone the repository source
```
git clone https://github.com/Lyx52/table-login-api/tree/master/src
```
Install the required packages from `package.json`
```
npm install
```
Edit the [`/src/db/db.config.js`](/src/db/db.config.js) file with the information about the database server. 

Start the API server
```
npm run
``` 
#### Docker
ToDo

## ToDo
- [ ] User Authentication.
- [ ] CRUD Functionality for storing/saving/editing track times.
- [ ] Moderator role for editing users/track data.
- [ ] Viewer role for potential auditing/guest viewing.
- [ ] Support for loading runner lists/data from JSON (for dropdowns etc.).
- [ ] Alerting endpoint for showing event related information/alerts.
- [ ] Automatic winner calculation(??)
- [ ] A lot of other stuff...


## Authors

* **Ikars Melnalksnis** - *Initial Work, Main developer* - [Lyx52](https://github.com/Lyx52)
* **Eduards Eglītis** - *Project Specifications, Oversight*
* **Reinis Gunārs Mednis** - *Readme, Code Cleanup, Dockerization* - [RMednis](https://github.com/RMednis)

## License

Licensed under the ISC License, Copyright © Eduards Eglītis, Ikars Melnalksnis, Reinis Gunārs Mednis - 2020

For more information, check [LICENSE.md](LICENSE.md)


