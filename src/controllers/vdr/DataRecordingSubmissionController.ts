import { VisitModel } from '../../models/VisitModel';
import { OrscfTokenService } from '../../services/OrscfTokenService';
import * as VdrModels from 'orscf-visitdata-contract';
import logger from 'jet-logger';
import { Request, Response } from 'express';
import { Controller, Post, ClassMiddleware } from '@overnightjs/core';

@Controller('dataRecordingSubmission')
@ClassMiddleware((req, res, next) =>
    OrscfTokenService.authorizeOrscf(req, res, next, ['API:SubjectSubmission'])
)
export class DataRecordingSubmissionController {
    private visitModel: VisitModel = new VisitModel();

    @Post('importDataRecordings')
    // @Middleware((req, res, next) =>
    //     OrscfTokenService.authorizeOrscf(req, res, next, ['api:importSubjects'])
    // )
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async importDataRecordings(req: Request, resp: Response) {
        try {
            const dataRecordings: VdrModels.DataRecordingStructure[] = req.body.dataRecordings;
            if (dataRecordings === undefined || dataRecordings === null) {
                return resp
                    .status(200)
                    .json({ fault: 'no dataRecordings on request', return: null });
            }

            const createdDataRecordingUids: string[] = [];
            const updatedDataRecordingUids: string[] = [];

            for (const dataRecording of dataRecordings) {
                const drExists: boolean = await this.visitModel.getDataRecordingExistence(
                    dataRecording.dataRecordingUid
                );
                if (drExists) {
                    await this.visitModel.updateDataRecording(dataRecording);
                    updatedDataRecordingUids.push(dataRecording.dataRecordingUid);
                } else {
                    await this.visitModel.createDataRecording(dataRecording);
                    createdDataRecordingUids.push(dataRecording.dataRecordingUid);
                }
            }

            return resp.status(200).json({
                fault: null,
                createdDataRecordingUids: createdDataRecordingUids,
                updatedDataRecordingUids: updatedDataRecordingUids
            });
        } catch (error) {
            logger.err(error, true);
            return resp.status(200).json({ fault: error.message, return: null });
        }
    }
}
