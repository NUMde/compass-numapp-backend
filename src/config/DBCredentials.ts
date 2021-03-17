/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as env from 'env-var';

/**
 * All database related configuration.
 */
export class DBCredentials {
    /**
     *
     * The data base hostname.
     * @static
     * @return {*}  {string}
     * @memberof DBCredentials
     */
    public static getHost(): string {
        return env.get('DB_HOST').required().asString();
    }

    /**
     * The port of the database server to use.
     *
     * @static
     * @return {*}  {number}
     * @memberof DBCredentials
     */
    public static getPort(): number {
        return env.get('DB_PORT').required().asIntPositive();
    }

    /**
     * The user of the database connection to use.
     *
     * @static
     * @return {*}  {string}
     * @memberof DBCredentials
     */
    public static getUser(): string {
        return env.get('database-user').required().asString();
    }

    /**
     * The password of the database connection to use.
     *
     * @static
     * @return {*}  {string}
     * @memberof DBCredentials
     */
    public static getPassword(): string {
        return env.get('database-password').required().asString();
    }

    /**
     * The database of the database connection to use.
     *
     * @static
     * @return {*}  {string}
     * @memberof DBCredentials
     */
    public static getDB(): string {
        return env.get('database-name').required().asString();
    }

    /**
     * Flag to enable SSL/TLS for the database connection.
     *
     * @static
     * @return {*}  {boolean}
     * @memberof DBCredentials
     */
    public static getUseSSL(): boolean {
        return env.get('DB_USE_SSL').default('true').asBoolStrict();
    }

    /**
     * The SSL/TLS certificate to use for the database connection.
     *
     * @static
     * @return {*}  {string}
     * @memberof DBCredentials
     */
    public static getSSLCA(): string {
        // this is the public certificate for all IBM cloud databases - expires 2028-10-08
        const defaultCloudCert =
            'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURIVENDQWdXZ0F3SUJBZ0lVVmlhMWZrWElsTXhGY2lob3lncWg2Yit6N0pNd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0hqRWNNQm9HQTFVRUF3d1RTVUpOSUVOc2IzVmtJRVJoZEdGaVlYTmxjekFlRncweE9ERXdNVEV4TkRRNApOVEZhRncweU9ERXdNRGd4TkRRNE5URmFNQjR4SERBYUJnTlZCQU1NRTBsQ1RTQkRiRzkxWkNCRVlYUmhZbUZ6ClpYTXdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFESkYxMlNjbTJGUmpQb2N1bmYKbmNkUkFMZDhJRlpiWDhpbDM3MDZ4UEV2b3ZpMTRHNGVIRWZuT1JRY2g3VElPR212RWxITVllbUtFT3Z3K0VZUApmOXpqU1IxNFVBOXJYeHVaQmgvZDlRa2pjTkw2YmMvbUNUOXpYbmpzdC9qRzJSbHdmRU1lZnVIQWp1T3c4bkJuCllQeFpiNm1ycVN6T2FtSmpnVVp6c1RMeHRId21yWkxuOGhlZnhITlBrdGFVMUtFZzNQRkJxaWpDMG9uWFpnOGMKanpZVVVXNkpBOWZZcWJBL1YxMkFsT3AvUXhKUVVoZlB5YXozN0FEdGpJRkYybkxVMjBicWdyNWhqTjA4SjZQUwpnUk5hNXc2T1N1RGZiZ2M4V3Z3THZzbDQvM281akFVSHp2OHJMaWF6d2VPYzlTcDBKd3JHdUJuYTFPYm9mbHU5ClM5SS9BZ01CQUFHalV6QlJNQjBHQTFVZERnUVdCQlJGejFFckZFSU1CcmFDNndiQjNNMHpuYm1IMmpBZkJnTlYKSFNNRUdEQVdnQlJGejFFckZFSU1CcmFDNndiQjNNMHpuYm1IMmpBUEJnTlZIUk1CQWY4RUJUQURBUUgvTUEwRwpDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ2t4NVJzbk9PMWg0dFJxRzh3R21ub1EwOHNValpsRXQvc2tmR0pBL2RhClUveEZMMndhNjljTTdNR1VMRitoeXZYSEJScnVOTCtJM1ROSmtVUEFxMnNhakZqWEtCeVdrb0JYYnRyc2ZKckkKQWhjZnlzN29tdjJmb0pHVGxJY0FybnBCL0p1bEZITmM1YXQzVk1rSTlidEh3ZUlYNFE1QmdlVlU5cjdDdlArSgpWRjF0YWxSUVpKandyeVhsWGJvQ0c0MTU2TUtwTDIwMUwyV1dqazBydlBVWnRKcjhmTmd6M24wb0x5MFZ0Zm93Ck1yUFh4THk5TlBqOGlzT3V0ckxEMjlJWTJBMFY0UmxjSXhTMEw3c1ZPeTB6RDZwbXpNTVFNRC81aWZ1SVg2YnEKbEplZzV4akt2TytwbElLTWhPU1F5dTRUME1NeTZmY2t3TVpPK0liR3JDZHIKLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=';
        return env.get('DB_SSL_CA').default(defaultCloudCert).asString();
    }
}
