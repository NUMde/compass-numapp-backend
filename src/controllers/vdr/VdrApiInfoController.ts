import { OrscfTokenService } from './../../services/OrscfTokenService';
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import logger from 'jet-logger';
import { Request, Response } from 'express';

import { Controller, Post } from '@overnightjs/core';

import {
    GetCapabilitiesResponse,
    GetApiVersionResponse,
    GetPermittedAuthScopesResponse
} from 'orscf-visitdata-contract';

@Controller('vdrApiInfo')
export class VdrApiInfoController {
    @Post('getApiVersion')
    public async getApiVersion(req: Request, resp: Response) {
        try {
            const returnObject: GetApiVersionResponse = {
                fault: null,
                return: '1.7.0'
            };
            return resp.status(200).json(returnObject);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getCapabilities')
    public async getCapabilities(req: Request, resp: Response) {
        try {
            const returnObject: GetCapabilitiesResponse = {
                fault: null,
                return: ['VdrApiInfo', 'VisitConsume', 'VisitSubmission']
            };
            return resp.status(200).json(returnObject);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getPermittedAuthScopes')
    public async getPermittedAuthScopes(req: Request, resp: Response) {
        try {
            const authorizationHeader = req.headers.authorization;
            const result: GetPermittedAuthScopesResponse =
                OrscfTokenService.getPermittedAuthScopes(authorizationHeader);
            return resp.status(200).json(result);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}
