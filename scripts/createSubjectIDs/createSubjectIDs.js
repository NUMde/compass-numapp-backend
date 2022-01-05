/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

require('dotenv').config({ path: __dirname + '/./../../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');

const fileName = 'SUBJECTID_input.txt';

async function processLineByLine(pool) {
    const fileStream = fs.createReadStream(fileName);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in SUBJECTID_input.txt as a single line break.

    let i = 1;

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        console.log('Processing line ' + i + ' with content: ' + line);
        try {
            await pool.query('INSERT INTO studyparticipant(subject_id) VALUES ($1);', [line]);
        } catch (err) {
            console.log(err);
            process.exit(1);
        }
        i++;
    }
}

async function start() {
    const sslConnOptions = {};
    if (process.env.DB_USE_SSL === 'true') {
        sslConnOptions.rejectUnauthorized = true;
        try {
            sslConnOptions.ca = Buffer.from(process.env.DB_SSL_CA, 'base64').toString();
        } catch (err) {
            console.warn(
                "Cannot get CA from environment variable DB_SSL_CA. Self-signed certificates in DB connection won't work!"
            );
        }
    }

    const pool = new Pool({
        user: process.env.DB_USERNAME,
        host: process.env.DB_HOST,
        database: process.env.DB_DB,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: process.env.DB_USE_SSL ? sslConnOptions : false
    });

    // you can also use async/await
    const res = await pool.query('SELECT NOW()');
    console.log(res.rows[0]);

    await processLineByLine(pool);

    await pool.end();
}

start();
