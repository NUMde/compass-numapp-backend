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
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async importVisits(req: Request, resp: Response) {
        try {
            const visits: VdrModels.VisitStructure[] = req.body.visits;
            if (!visits) {
                return resp.status(200).json({ fault: 'no visits on request', return: null });
            }

            const createdVisitUids: string[] = [];
            const updatedVisitUids: string[] = [];

            for (const visit of visits) {
                if (typeof visit.scheduledDateUtc === 'string') {
                    const parsedDate: Date = new Date(visit.scheduledDateUtc);
                    visit.scheduledDateUtc = parsedDate;
                }

                if (typeof visit.executionDateUtc === 'string') {
                    const parsedDate: Date = new Date(visit.executionDateUtc);
                    visit.executionDateUtc = parsedDate;
                }

                await this.visitModel.updateVisit(visit);
                updatedVisitUids.push(visit.visitUid);
            }

            return resp.status(200).json({
                fault: null,
                createdVisitUids,
                updatedVisitUids
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
            if (!mutationsByVisitUid) {
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
                updatedVisitUids,
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
            if (!visitUids) {
                return resp.status(200).json({ fault: 'no visits on request', return: null });
            }
            const mutation: VdrModels.BatchableVisitMutation = req.body.mutation;
            if (!mutation) {
                return resp.status(200).json({ fault: 'no mutation on request', return: null });
            }

            const updatedVisitUids: string[] = [];
            for (const visitUid of visitUids) {
                const visitWasUpdated = await this.visitModel.applyVisitMutation(
                    visitUid,
                    mutation
                );
                if (visitWasUpdated) {
                    updatedVisitUids.push(visitUid);
                }
            }
            // test
            return resp.status(200).json({
                updatedVisitUids,
                fault: null
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}