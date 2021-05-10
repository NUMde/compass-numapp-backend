/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Response } from 'express';

import { Controller, Delete, Get, Middleware } from '@overnightjs/core';
import { ISecureRequest } from '@overnightjs/jwt';
import { Logger } from '@overnightjs/logger';

import { CTransfer } from '../types/CTransfer';
import { QueueEntry } from '../types/QueueEntry';
import { QueueModel } from '../models/QueueModel';
import { SecurityService } from '../services/SecurityService';
import { AuthorizationController } from './AuthorizationController';

/**
 * Endpoint class for all download related restful methods.
 *
 * @export
 * @class DownloadController
 */
@Controller('download')
export class DownloadController {
    private queueModel: QueueModel = new QueueModel();

    private limitEntries = 50;

    /**
     * Provide study data to the caller.
     *
     * @param {ISecureRequest} req
     * @param {Response} resp
     * @return {*}
     * @memberof DownloadController
     */
    @Get()
    @Middleware(AuthorizationController.checkApiUserLogin)
    public async getAvailableDataFromQueue(req: ISecureRequest, resp: Response) {
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
     * Delete study data from the download queue.
     *
     * @param {ISecureRequest} req
     * @param {Response} resp
     * @return {*}
     * @memberof DownloadController
     */
    @Delete()
    @Middleware(AuthorizationController.checkApiParticipantLogin)
    public async deleteDataFromQueue(req: ISecureRequest, resp: Response) {
        try {
            if (!Array.isArray(req.body)) {
                return resp.sendStatus(400);
            }
            const deletedRowCount = await this.queueModel.deleteQueueDataByIdArray(req.body);
            return resp.status(200).send({ deletedRowCount });
        } catch (err) {
            Logger.Err(err, true);
            return resp.sendStatus(500);
        }
    }
}
