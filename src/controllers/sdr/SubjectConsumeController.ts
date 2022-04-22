import { OrscfTokenService } from './../../services/OrscfTokenService';
import { SubjectIdentitiesModel } from './../../models/SubjectIdentitiesModel';
import Logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';
import {
    CheckSubjectExisitenceRequest,
    CheckSubjectExisitenceResponse,
    ExportSubjectsRequest,
    ExportSubjectsResponse,
    GetSubjectFieldsRequest,
    GetSubjectFieldsResponse,
    SearchChangedSubjectsRequest,
    SearchChangedSubjectsResponse,
    SearchSubjectsRequest,
    SearchSubjectsResponse
} from 'orscf-subjectdata-contract/dtos';
import {
    SubjectFields,
    SubjectMetaRecord,
    SubjectStructure
} from 'orscf-subjectdata-contract/models';

@Controller('subjectConsume')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectConsume'])
)
export class SubjectConsumeController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    @Post('searchSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async searchSubjects(req: Request, resp: Response) {
        try {
            const searchRequest: SearchSubjectsRequest = req.body;
            if (searchRequest === undefined || searchRequest === null) {
                return resp.status(200).json({ fault: 'invalid search request', return: null });
            }

            const result: SubjectMetaRecord[] = await this.subjectIdentityModel.searchParticipants(
                searchRequest,
                undefined,
                searchRequest.sortingField,
                searchRequest.sortDescending
            );

            const response: SearchSubjectsResponse = {
                fault: null,
                result: result
            };
            return resp.status(200).json(response);
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('searchChangedSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async searchChangedSubjects(req: Request, resp: Response) {
        try {
            const searchRequest: SearchChangedSubjectsRequest = req.body;

            if (searchRequest === undefined || searchRequest === null) {
                return resp.status(200).json({ fault: 'invalid search request', return: null });
            }

            const result: SubjectMetaRecord[] = await this.subjectIdentityModel.searchParticipants(
                searchRequest,
                <Date>(<unknown>searchRequest.minTimestampUtc),
                'last_action',
                true
            );

            const response: SearchChangedSubjectsResponse = {
                fault: null,
                createdRecords: [], //TODO
                modifiedRecords: result,
                archivedRecords: [],
                latestTimestampUtc: 0
            };
            return resp.status(200).json(response);
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getCustomFieldDescriptorsForSubject')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async getCustomFieldDescriptorsForSubject(req: Request, resp: Response) {
        try {
            return resp.status(200).json({
                fault: null,
                result: []
            });
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('checkSubjectExistence')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async checkSubjectExistence(req: Request, resp: Response) {
        try {
            const request: CheckSubjectExisitenceRequest = req.body;
            const subjectUids: string[] = request.subjectUids;
            const unavailableSubjectUids: string[] = [];
            const availableSubjectUids: string[] = [];

            for (const subjectUid of subjectUids) {
                const subjectExists: boolean = await this.subjectIdentityModel.getSubjectIdentityExistenceBySubjectUid(
                    subjectUid
                );
                if (subjectExists) {
                    availableSubjectUids.push(subjectUid);
                } else {
                    unavailableSubjectUids.push(subjectUid);
                }
            }
            const response: CheckSubjectExisitenceResponse = {
                unavailableSubjectUids: unavailableSubjectUids,
                availableSubjectUids: availableSubjectUids,
                fault: null
            };

            return resp.status(200).json(response);
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('getSubjectFields')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async getSubjectFields(req: Request, resp: Response) {
        try {
            const request: GetSubjectFieldsRequest = req.body;
            const subjectUids: string[] = request.subjectUids;

            if (subjectUids === undefined || subjectUids === null || subjectUids.length === 0) {
                return resp.status(200).json({
                    unavailableSubjectUids: [],
                    result: [],
                    fault: null
                });
            }
            const result: SubjectFields[] = await this.subjectIdentityModel.getSubjects(
                subjectUids
            );

            const unavailableSubjectUids: string[] = subjectUids.filter(
                (s) => result.map((r) => r.subjectUid).indexOf(s) < 0
            );
            const response: GetSubjectFieldsResponse = {
                unavailableSubjectUids: unavailableSubjectUids,
                result: result,
                fault: null
            };
            return resp.status(200).json(response);
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('exportSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async exportSubjects(req: Request, resp: Response) {
        try {
            const request: ExportSubjectsRequest = req.body;
            const subjectUids: string[] = request.subjectUids;

            if (subjectUids === undefined || subjectUids === null || subjectUids.length === 0) {
                return resp.status(200).json({
                    unavailableSubjectUids: [],
                    result: [],
                    fault: null
                });
            }
            const result: SubjectStructure[] = await this.subjectIdentityModel.getSubjects(
                subjectUids
            );

            const unavailableSubjectUids: string[] = subjectUids.filter(
                (s) => result.map((r) => r.subjectUid).indexOf(s) < 0
            );
            const response: ExportSubjectsResponse = {
                unavailableSubjectUids: unavailableSubjectUids,
                result: result,
                fault: null
            };
            return resp.status(200).json(response);
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}
