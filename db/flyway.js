// Borrowed from: https://github.com/markgardner/node-flywaydb/blob/HEAD/sample/config.js
const dotenv = require('dotenv');

module.exports = function () {
    dotenv.config('../env');
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    return {
        flywayArgs: {
            // JDBC string that addresses the database
            url: `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}`,
            // the default schema of a Postgresql database
            schemas: 'public',
            // local location where the db migration scripts are stored
            locations: 'filesystem:db/migration',

            user: DB_USER,
            password: DB_PASSWORD
        }
    };
};
