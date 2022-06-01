/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Application } from 'express';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';

import { CustomRoutes } from './CustomRoutes';

/**
 * This class has all the logic to expose a Swagger UI with the OpenApi documentation of this application.
 *
 * @export
 * @class SwaggerUI
 */
export class SwaggerUI {
    constructor(private app: Application) {}

    /**
     * Expose a route with the OpenApi documentation of this application.
     *
     * @memberof SwaggerUI
     */
    public async start(): Promise<void> {
        // The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
        const spec = fs.readFileSync(path.join(__dirname, '../assets/openapi.yaml'), 'utf8');
        const swaggerDoc = jsyaml.load(spec);
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
        CustomRoutes.addRoute('GET', '/docs');
    }
}
