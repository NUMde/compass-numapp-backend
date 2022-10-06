import { VisitModel } from './../../models/VisitModel';
import { OrscfTokenService } from './../../services/OrscfTokenService';
import * as VdrModels from 'orscf-visitdata-contract';
import logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';

@Controller('visitSubmission')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectSubmission'])
)
export class VisitSubmissionController {
    private visitModel: VisitModel = new VisitModel();

    @Post('importVisits')
    // @Middleware((req, res, next) =>
    //     OrscfTokenService.authorizeOrscf(req, res, next, ['api:importSubjects'])
    // )
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async importVisits(req: Request, resp: Response) {
        try {
            const visits: VdrModels.VisitStructure[] = req.body.visits;
            if (visits === undefined || visits === null) {
                return resp.status(200).json({ fault: 'no visits on request', return: null });
            }

            const createdVisitUids: string[] = [];
            const updatedVisitUids: string[] = [];

            for (const visit of visits) {
                const visitExists: boolean = await this.visitModel.getDataRecordingExistence(
                    visit.visitUid
                );
                if (visitExists) {
                    await this.visitModel.updateVisit(visit);
                    updatedVisitUids.push(visit.visitUid);
                } else {
                    await this.visitModel.createVisit(visit);
                    createdVisitUids.push(visit.visitUid);
                }
                for (const dataRecording of visit.dataRecordings) {
                    const dataRecordingExists: boolean =
                        await this.visitModel.getDataRecordingExistence(
                            dataRecording.dataRecordingUid
                        );
                    if (dataRecordingExists) {
                        await this.visitModel.updateDataRecording(dataRecording);
                    } else {
                        await this.visitModel.createDataRecording(dataRecording);
                    }
                }
            }

            return resp.status(200).json({
                fault: null,
                createdVisitUids: createdVisitUids,
                updatedVisitUids: updatedVisitUids
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('applyVisitMutations')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async applyVisitMutations(req: Request, resp: Response) {
        try {
            const mutationsByVisitUid: {
                [subjectUid: string]: VdrModels.VisitMutation;
            } = req.body.mutationsByVisitUid;
            logger.info(req.body);
            if (mutationsByVisitUid === undefined || mutationsByVisitUid === null) {
                return resp.status(200).json({ fault: 'no visits on request', return: null });
            }
            const updatedVisitUids: string[] = [];

            for (const visitUid in mutationsByVisitUid) {
                const visitMutation: VdrModels.VisitMutation = mutationsByVisitUid[visitUid];
                const visitWasUpdated: boolean = await this.visitModel.applyVisitMutation(
                    visitUid,
                    visitMutation
                );
                if (visitWasUpdated) {
                    updatedVisitUids.push(visitUid);
                }
            }

            return resp.status(200).json({
                updatedVisitUids: updatedVisitUids,
                fault: null
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('applyVisitBatchMutation')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async applyVisitBatchMutation(req: Request, resp: Response) {
        try {
            const visitUids: string[] = req.body.visitUids;
            if (visitUids === undefined || visitUids === null) {
                return resp.status(200).json({ fault: 'no visits on request', return: null });
            }
            const mutation: VdrModels.BatchableVisitMutation = req.body.mutation;
            if (mutation === undefined || visitUids === null) {
                return resp.status(200).json({ fault: 'no mutation on request', return: null });
            }

            const updatedVisitUids: string[] = [];
            for (const visitUid of visitUids) {
                //console.log('visitUid', visitUid);
                const visitWasUpdated = await this.visitModel.applyVisitMutation(
                    visitUid,
                    mutation
                );
                if (visitWasUpdated) {
                    updatedVisitUids.push(visitUid);
                }
            }

            return resp.status(200).json({
                updatedVisitUids: updatedVisitUids,
                fault: null
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ faule: error.message, return: null });
        }
    }
}
