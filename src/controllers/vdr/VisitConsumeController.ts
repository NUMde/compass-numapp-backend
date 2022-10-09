import { OrscfTokenService } from './../../services/OrscfTokenService';
import { VisitModel } from './../../models/VisitModel';
import logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';
import {
    CheckVisitExisitenceRequest,
    CheckVisitExisitenceResponse,
    ExportVisitsRequest,
    ExportVisitsResponse,
    GetVisitFieldsRequest,
    GetVisitFieldsResponse,
    SearchChangedVisitsRequest,
    SearchVisitsRequest,
    SearchVisitsResponse
} from 'orscf-visitdata-contract';
import { VisitFields, VisitMetaRecord, VisitStructure } from 'orscf-visitdata-contract';

@Controller('visitConsume')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectConsume'])
)
export class VisitConsumeController {
    private visitModel: VisitModel = new VisitModel();

    @Post('searchVisits')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async searchVisits(req: Request, resp: Response) {
        try {
            const searchRequest: SearchVisitsRequest = req.body;
            if (searchRequest === undefined || searchRequest == null) {
                return resp.status(200).json({ fault: 'invalid search request', return: null });
            }

            const result: VisitMetaRecord[] = await this.visitModel.searchVisits(
                searchRequest,
                undefined,
                searchRequest.sortingField,
                searchRequest.sortDescending
            );

            const response: SearchVisitsResponse = {
                fault: null,
                result: result
            };
            return resp.status(200).json(response);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('searchChangedVisits')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async searchChangedVisits(req: Request, resp: Response) {
        try {
            const searchRequest: SearchChangedVisitsRequest = req.body;
            if (searchRequest === undefined || searchRequest == null) {
                return resp.status(200).json({ fault: 'invalid search request', return: null });
            }

            const result: VisitMetaRecord[] = await this.visitModel.searchChangedVisits(
                searchRequest,
                searchRequest.minTimestampUtc
            );

            const response: SearchVisitsResponse = {
                fault: null,
                result: result
            };
            return resp.status(200).json(response);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getCustomFieldDescriptorsForVisit')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async getCustomFieldDescriptorsForVisit(req: Request, resp: Response) {
        try {
            return resp.status(200).json({
                fault: null,
                result: []
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('checkVisitExistence')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async checkSubjectExistence(req: Request, resp: Response) {
        try {
            const request: CheckVisitExisitenceRequest = req.body;
            const visitUids: string[] = request.visitUids;
            const unavailableVisitUids: string[] = [];
            const availableVisitUids: string[] = [];

            for (const visitUid of visitUids) {
                const subjectExists: boolean = await this.visitModel.getDataRecordingExistence(
                    visitUid
                );
                if (subjectExists) {
                    availableVisitUids.push(visitUid);
                } else {
                    unavailableVisitUids.push(visitUid);
                }
            }
            const response: CheckVisitExisitenceResponse = {
                unavailableVisitUids: unavailableVisitUids,
                availableVisitUids: availableVisitUids,
                fault: null
            };

            return resp.status(200).json(response);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getVisitFields')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async getVisitFields(req: Request, resp: Response) {
        try {
            const request: GetVisitFieldsRequest = req.body;
            const visitUids: string[] = request.visitUids;

            if (visitUids === undefined || visitUids === null || visitUids.length === 0) {
                return resp.status(200).json({
                    unavailableVisitUids: [],
                    result: [],
                    fault: null
                });
            }
            const result: VisitFields[] = await this.visitModel.getVisits(visitUids);

            const unavailableVisitUids: string[] = visitUids.filter(
                (s) => result.map((r) => r.visitUid).indexOf(s) < 0
            );
            const response: GetVisitFieldsResponse = {
                unavailableVisitUids: unavailableVisitUids,
                result: result,
                fault: null
            };
            return resp.status(200).json(response);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('exportVisits')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async exportVisits(req: Request, resp: Response) {
        try {
            const request: ExportVisitsRequest = req.body;
            const visitUids: string[] = request.visitUids;

            if (visitUids === undefined || visitUids === null || visitUids.length === 0) {
                return resp.status(200).json({
                    unavailableVisitUids: [],
                    result: [],
                    fault: null
                });
            }
            const result: VisitStructure[] = await this.visitModel.getVisits(visitUids);

            for (const visit of result) {
                visit.dataRecordings = await this.visitModel.getDataRecordings(visit.visitUid);
            }

            const unavailableVisitUids: string[] = visitUids.filter(
                (s) => result.map((r) => r.visitUid).indexOf(s) < 0
            );
            const response: ExportVisitsResponse = {
                unavailableVisitUids: unavailableVisitUids,
                result: result,
                fault: null
            };
            return resp.status(200).json(response);
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}
