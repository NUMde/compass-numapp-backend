import { OrscfTokenService } from './../../services/OrscfTokenService';
import { SdrMappingHelper } from './../../services/SdrMappingHelper';
import { ParticipantEntry } from './../../types/ParticipantEntry';
import { SubjectIdentitiesModel } from './../../models/SubjectIdentitiesModel';
import * as SdrModels from 'orscf-subjectdata-contract';
import logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';
import { OrscfAuthConfig } from '../../config/OrscfAuthConfig';

@Controller('subjectSubmission')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectSubmission'])
)
export class SubjectSubmissionController {
    private subjectIdentityModel: SubjectIdentitiesModel = new SubjectIdentitiesModel();

    @Post('importSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async importSubjects(req: Request, resp: Response) {
        try {
            const subjects: SdrModels.SubjectStructure[] = req.body.subjects;
            if (!subjects) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }

            const studyUid = OrscfAuthConfig.getStudyUid();
            const createdSubjectUids: string[] = [];
            const updatedSubjectUids: string[] = [];

            for (const subject of subjects) {
                if (subject.studyUid != studyUid) {
                    throw { message: "This backend is dedicated for studyUid '" + studyUid + "'" };
                }

                if (typeof subject.periodStart === 'string') {
                    const parsedDate = new Date(subject.periodStart);
                    subject.periodStart = parsedDate;
                }

                if (typeof subject.periodEnd === 'string') {
                    const parsedDate: Date = new Date(subject.periodEnd);
                    subject.periodEnd = parsedDate;
                }

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
                createdSubjectUids,
                updatedSubjectUids
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('archiveSubjects')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async archiveSubjects(req: Request, resp: Response) {
        try {
            const subjectUids: string[] = req.body.subjectUids;
            if (!subjectUids) {
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
                archivedSubjectUids
            });
        } catch (error) {
            logger.err(error, true);
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
            if (!mutationsBySubjectUid) {
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
                updatedSubjectUids,
                fault: null
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }

    @Post('applySubjectBatchMutation')
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async applySubjectBatchMutation(req: Request, resp: Response) {
        try {
            const subjectUids: string[] | undefined | null = req.body.subjectUids;
            if (!subjectUids) {
                return resp.status(200).json({ fault: 'no subjects on request', return: null });
            }
            const mutation: SdrModels.BatchableSubjectMutation | undefined = req.body.mutation;
            if (!mutation) {
                return resp.status(200).json({ fault: 'no mutation on request', return: null });
            }

            const updatedSubjectUids: string[] = await this.subjectIdentityModel.updateSubjects(
                subjectUids,
                mutation
            );

            return resp.status(200).json({
                updatedSubjectUids,
                fault: null
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}