/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { Request, Response } from 'express';
import jwt from 'express-jwt';

import { ClassMiddleware, Controller, Get, Put } from '@overnightjs/core';
import Logger from 'jet-logger';

import { CTransfer } from '../types/CTransfer';
import { QueueEntry } from '../types/QueueEntry';
import { QueueModel } from '../models/QueueModel';
import { SecurityService } from '../services/SecurityService';
import { AuthorizationController } from './AuthorizationController';
import { AuthConfig } from './../config/AuthConfig';

/**
 * Endpoint class for all download related restful methods.
 *
 * All routes use a middleware which checks if the header of the request contains a valid JWT with valid authentication data
 *
 * @export
 * @class DownloadController
 */
@Controller('download')
@ClassMiddleware(
    jwt({
        secret: AuthConfig.jwtSecret,
        algorithms: ['HS256'],
        requestProperty: 'payload',
        isRevoked: AuthorizationController.checkApiUserLogin
    })
)
export class DownloadController {
    private queueModel: QueueModel = new QueueModel();

    private limitEntries = 50;

    /**
     * Provide study data to the caller.
     *
     * @param {Request} req
     * @param {Response} resp
     * @return {*}
     * @memberof DownloadController
     */
    @Get()
    public async getAvailableDataFromQueue(req: Request, resp: Response): Promise<Response> {
        try {
            const page: number = req.query.page ? parseInt(req.query.page.toString(), 10) : 1;
            if (page < 1) {
                return resp.sendStatus(400);
            }
            const totalEntries: number = parseInt(
                await this.queueModel.countAvailableQueueData(),
                10
            );
            const queueEntries: QueueEntry[] = await this.queueModel.getAvailableQueueData(
                this.limitEntries,
                page
            );
            const transferItems: CTransfer[] = this.prepareQueueEntries(queueEntries);
            const signedItems = SecurityService.sign(transferItems);

            SecurityService.verifyJWS(signedItems);

            return resp.status(200).json({
                totalEntries,
                totalPages: Math.ceil(totalEntries / this.limitEntries),
                currentPage: page,
                cTransferList: signedItems
            });
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }

    private prepareQueueEntries(queueEntries: QueueEntry[]) {
        const cTransferList: CTransfer[] = new Array<CTransfer>();
        for (const queueEntry of queueEntries) {
            const cTransfer: CTransfer = {
                UUID: queueEntry.id,
                SubjectId: queueEntry.subject_id,
                JSON: queueEntry.encrypted_resp,
                AbsendeDatum: queueEntry.date_sent,
                ErhaltenDatum: queueEntry.date_received
            };
            cTransferList.push(cTransfer);
        }
        return cTransferList;
    }

    /**
     * Mark queue entries as downloaded
     *
     * @param {Request} req
     * @param {Response} resp
     * @return {*}
     * @memberof DownloadController
     */
    @Put()
    public async markAsDownloaded(req: Request, resp: Response): Promise<Response> {
        try {
            if (!Array.isArray(req.body)) {
                return resp.sendStatus(400);
            }
            const updatedRowCount = await this.queueModel.markAsDownloaded(req.body);
            return resp.status(200).send({ updatedRowCount: updatedRowCount });
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }
}
