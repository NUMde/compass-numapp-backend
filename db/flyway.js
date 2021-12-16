// Borrowed from: https://github.com/markgardner/node-flywaydb/blob/HEAD/sample/config.js
module.exports = function() {
    return {
        flywayArgs: {
            // JDBC string that addresses the database
            url: 'jdbc:postgresql://localhost:15432/compass',
            // the default schema of a Postgresql database
            schemas: 'public',
            // local location where the db migration scripts are stored
            locations: 'filesystem:db/migration',

            // if not set here, flyway will ask during execution
            // user: 'DB_USER',
            // password: 'DB_PASSWORD',
        }
        // version: '7.8.2', // optional, empty or missing will download the latest (7.8.2 is known to be working)
    };
};
