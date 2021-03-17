// Borrowed from: https://github.com/markgardner/node-flywaydb/blob/HEAD/sample/config.js
module.exports = function() {
    return {
        flywayArgs: {
            url: 'jdbc:postgresql://localhost:15432/compass',
            schemas: 'public',
            locations: 'filesystem:db/migration',

            // if not set here, flyway will ask during execution
            // user: 'DB_USER',
            // password: 'DB_PASSWORD',
        },
        // version: '7.5.0', // optional, empty or missing will download the latest
    };
};
