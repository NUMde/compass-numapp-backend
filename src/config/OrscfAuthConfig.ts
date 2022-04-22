import env from 'env-var';

export class OrscfAuthConfig {
    public static getAllowedIssuers(): string[] {
        return env.get('JWT_ALLOWED_ISSUERS').default('*').asArray(';');
    }
    public static getAllowedHosts(): string[] {
        return env.get('JWT_ALLOWED_HOSTS').default('*').asArray(';');
    }
    public static getStudyUid(): string {
        return env.get('STUDY_UID').default('').asString();
    }
    public static getOrscfPublicKey(): string {
        return env.get('ORSCF_PUBLIC_KEY').default('false').asString().replace(/\\n/g, '\n');
    }
    public static getOrscfPublicKeyOrSecretByIssuer(issuer: string): string {
        issuer = issuer.replace('.', '');
        issuer = issuer.replace(':', '');
        issuer = issuer.replace('/', '');
        issuer = issuer.replace('\\', '');
        issuer = issuer.replace('-', '');
        return env
            .get('ORSCF_JWT_PUBLIC_KEY_OR_SECRET_' + issuer)
            .default('false')
            .asString()
            .replace(/\\n/g, '\n');
    }
}
