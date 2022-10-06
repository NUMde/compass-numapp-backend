import { OrscfTokenService } from './../../services/OrscfTokenService';
import { SdrMappingHelper } from './../../services/SdrMappingHelper';
import { ParticipantEntry } from './../../types/ParticipantEntry';
import { SubjectIdentitiesModel } from './../../models/SubjectIdentitiesModel';
import * as SdrModels from 'orscf-subjectdata-contract/models';
import Logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';

@Controller('subjectSubmission')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectSubmission'])
)
export class SubjectSubmissionController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    @Post('importSubjects')
    // @Middleware((req, res, next) =>
    //     OrscfTokenService.authorizeOrscf(req, res, next, ['api:importSubjects'])
    // )
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async importSubjects(req: Request, resp: Response) {
        try {
            const subjects: SdrModels.SubjectStructure[] = req.body.subjects;
            if (subjects === undefined || subjects === null) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }

            const createdSubjectUids: string[] = [];
            const updatedSubjectUids: string[] = [];

            for (const subject of subjects) {
                const participant: ParticipantEntry =
                    SdrMappingHelper.mapSubjectToParticipantEntry(subject);
                const subjectIdentityExistence: boolean =
                    await this.subjectIdentityModel.getSubjectIdentityExistence(
                        participant.subject_id
                    );
                if (subjectIdentityExistence) {
                    await this.subjectIdentityModel.updateStudyParticipant(participant);
                    updatedSubjectUids.push(participant.subject_uid);
                } else {
                    await this.subjectIdentityModel.createStudyParticipant(participant);
                    createdSubjectUids.push(participant.subject_uid);
                }
            }

            return resp.status(200).json({
                fault: null,
                createdSubjectUids: createdSubjectUids,
                updatedSubjectUids: updatedSubjectUids
            });
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('archiveSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async archiveSubjects(req: Request, resp: Response) {
        try {
            const subjectUids: string[] = req.body.subjectUids;
            if (subjectUids === undefined || subjectUids === null) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }

            const archivedSubjectUids: string[] = [];

            for (const subjectUid of subjectUids) {
                const subjectIdentityExistence: boolean =
                    await this.subjectIdentityModel.getSubjectIdentityExistence(subjectUid);
                if (!subjectIdentityExistence) {
                    return resp.status(200).json({ fault: 'subject not found', return: null });
                }
            }

            for (const subjectUid of subjectUids) {
                await this.subjectIdentityModel.deleteStudyParticipant(subjectUid);
                archivedSubjectUids.push(subjectUid);
            }

            return resp.status(200).json({
                fault: null,
                archivedSubjectUids: archivedSubjectUids
            });
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('applySubjectMutations')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async applySubjectMutations(req: Request, resp: Response) {
        try {
            const mutationsBySubjectUid: {
                [subjectUid: string]: SdrModels.SubjectMutation;
            } = req.body.mutationsBySubjecttUid;
            if (mutationsBySubjectUid === undefined || mutationsBySubjectUid === null) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }

            const updatedSubjectUids: string[] = [];

            for (const subjectUid in mutationsBySubjectUid) {
                const subjectMutation: SdrModels.SubjectMutation =
                    mutationsBySubjectUid[subjectUid];
                const subjectWasUpdated: boolean = await this.subjectIdentityModel.updateSubject(
                    subjectUid,
                    subjectMutation
                );
                if (subjectWasUpdated) {
                    updatedSubjectUids.push(subjectUid);
                }
            }

            return resp.status(200).json({
                updatedSubjectUids: updatedSubjectUids,
                fault: null
            });
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('applySubjectBatchMutation')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async applySubjectBatchMutation(req: Request, resp: Response) {
        try {
            const subjectUids: string[] = req.body.subjectUids;
            if (subjectUids === undefined || subjectUids === null) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }
            const mutation: SdrModels.BatchableSubjectMutation = req.body.mutation;
            if (mutation === undefined || subjectUids === null) {
                return resp.status(200).json({ fault: 'no mutation on request', return: null });
            }

            const updatedSubjectUids: string[] = await this.subjectIdentityModel.updateSubjects(
                subjectUids,
                mutation
            );

            return resp.status(200).json({
                updatedSubjectUids: updatedSubjectUids,
                fault: null
            });
        } catch (error) {
            Logger.Err(error, true);
            return resp.status(200).json({ faule: error.message, return: null });
        }
    }
}
