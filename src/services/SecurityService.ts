/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jws from 'jws';

import logger from 'jet-logger';

import { COMPASSConfig } from '../config/COMPASSConfig';
import { PerformanceLogger } from './PerformanceLogger';

/**
 * Encryption related logic.
 *
 * @export
 * @class SecurityService
 */
export class SecurityService {
    /**
     * Retrieve the servers public key.
     * The key will be loaded from the process environment or as fallback from the filesystem.
     *
     * @static
     * @return {*}  {string}
     * @memberof SecurityService
     */
    public static getServerPublicKey(): string {
        const pubKey = COMPASSConfig.getIBMPublicKey();
        if (pubKey === 'false') {
            logger.err('Attention: Using public key from file');
            return fs.readFileSync('./public_key.pem', 'utf8');
        } else {
            return pubKey;
        }
    }

    /**
     * Retrieve the servers private key.
     * The key will be loaded from the process environment or as fallback from the filesystem.
     *
     * @static
     * @return {*}  {string}
     * @memberof SecurityService
     */
    public static getServerSecretKey(): string {
        const privKey = COMPASSConfig.getIBMPrivateKey();
        if (privKey === 'false') {
            logger.err('Attention: Using private key from file');
            return fs.readFileSync('./private_key.pem', 'utf8');
        } else {
            return privKey;
        }
    }

    /**
     *
     * Sign a string with server's private key with RSA-SHA256.
     * The certificate used for the API Login is used here as well.
     * The result is a string in JWS format.
     *
     * @param toSign The data to be signed
     */
    public static sign(toSign: unknown): string {
        const perfLog = PerformanceLogger.startMeasurement('SecurityService', 'sign');
        let jwsObj: string;
        try {
            /* RSASSA using SHA-256 hash algorithm */
            const header: jws.Header = { alg: 'RS256' };
            const privateKey = this.getServerSecretKey();
            jwsObj = jws.sign({
                header,
                payload: toSign,
                privateKey
            });
        } catch (err) {
            logger.err('[SecurityService.sign] ' + JSON.stringify(err));
            throw new Error('signature_creation_failed');
        }
        PerformanceLogger.endMeasurement(perfLog);
        return jwsObj;
    }

    /**
     * Method to verify a string against a signature (RSA-SHA256)
     *
     * @param toVerify The data to be verified (string in JWS format)
     */
    public static verifyJWS(toVerify: string): void {
        try {
            const verifyResult = jws.verify(toVerify, 'RS256', this.getServerPublicKey());
            if (!verifyResult) {
                throw new Error('validation_result_false');
            }
        } catch (err) {
            logger.err('[SecurityService.sign] ' + JSON.stringify(err));
            throw new Error('signature_validation_failed');
        }
    }

    /**
     * Decrypt a ciphertext from AES-256-CBC after decrypting the corresponding key from RSA-PKCS1
     *
     * @param ciphertext The data to be decrypted (base64 encoded string)
     * @param encryptedKey The rsa-encrypted key (base64 encoded string)
     * @param nonce  The nonce for ciphertext decryption (base64 encoded string)
     */
    public static decryptLogin(ciphertext: string, encryptedKey: string, nonce: string): string {
        try {
            let key: Buffer;
            try {
                key = crypto.privateDecrypt(
                    {
                        key: this.getServerSecretKey(),
                        padding: crypto.constants.RSA_PKCS1_PADDING
                    },
                    Buffer.from(encryptedKey, 'base64')
                );
            } catch (err) {
                logger.err(
                    '[SecurityService.decryptLogin][key_decryption_failed] ' + JSON.stringify(err)
                );
                throw new Error('key_decryption_failed');
            }

            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                key,
                Buffer.from(nonce, 'base64')
            );
            const decrypted =
                decipher.update(ciphertext, 'base64', 'utf8') + decipher.final('utf8');

            return decrypted;
        } catch (err) {
            if (err !== 'key_decryption_failed') {
                logger.err(
                    '[SecurityService.decryptLogin][decryption_failed] ' + JSON.stringify(err)
                );
            }
            throw new Error('decryption_failed');
        }
    }

    /**
     * Creates a hash for a user password with given salt or randomly created salt
     * @param password The users password
     * @param salt The salt
     */
    public static createPasswordHash(
        password: string,
        salt?: string
    ): {
        salt: string;
        passwordHash: string;
    } {
        if (salt === undefined) {
            salt = crypto
                .randomBytes(Math.ceil(16 / 2))
                .toString('hex')
                .slice(0, 16);
        }
        const hmac: crypto.Hmac = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hmac.update(password);
        const passwordHash = hmac.digest('hex');

        return {
            salt,
            passwordHash
        };
    }
}
