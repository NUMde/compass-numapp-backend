import { PushService } from '../services/PushService';
import { Post } from '@overnightjs/core';
/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';
import { Logger } from '@overnightjs/logger';

// TODO remove once working

@Controller('test')
export class TestController {
    @Post('test')
    public async testPush(req: ISecureRequest, resp: Response) {
        try {
            // validate parameter
            if (!req.body.token) {
                return resp.status(400).send({ error: 'missing_data' });
            }
            await new PushService().send('Ein neuer Fragebogen ist da!', [
                req.body.token.toString()
            ]);
            return resp.sendStatus(204);
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }
}
