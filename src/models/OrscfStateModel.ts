import { VisitModelHelper } from './VisitModelHelper';
import { DataRecordingStructure } from 'orscf-visitdata-contract';
import { ExampleStateModel } from './ExampleStateModel';
import { COMPASSConfig } from '../config/COMPASSConfig';
import { IdHelper } from '../services/IdHelper';
import { StateChangeTrigger, ParticipationStatus, ParticipantEntry } from '../types';
import { StateModel } from './StateModel';

export class OrscfStateModel implements StateModel {
    private fallbackModel: ExampleStateModel = new ExampleStateModel();

    async calculateUpdatedData(
        participant: ParticipantEntry,
        parameters: StateChangeTrigger
    ): Promise<ParticipantEntry> {
        const result = this.tryGetNextDataRecording(participant).then((nextDataRecording) => {

            //HACK: we are not allowed to change the behaviour of the ExampleStatemodel!
            //To handle the strange behaviour when setting initial values, we need:
            //A) to prepare the participant to always have an instance_id
            //(avoids that history-entries will created using the initialQuestionaireName as instance_id ???)
            //and we need B) to fix up the questionnaire id itself, if it was set to
            //the hardcoded fallback value 'initial'
            //(avoids getting exceptions when other code locations trying to load the non existing questionnaire using this name)

            // A)
            if(!participant.current_instance_id){
                participant.current_instance_id = IdHelper.createID();
            }

            const updatedParticipant: ParticipantEntry = { ...participant };
            //indicates, that we not use a completely remote controlled backend (as ORSCF pref.)
            if (nextDataRecording == null) {
                const result = this.fallbackModel.calculateUpdatedData(participant, parameters);
                return result.then((entry) => {
                    //B): if the InitialQuestionnaireId isnt configured properly...
                    if(entry.current_questionnaire_id == 'initial'){
                        //... use the DefaultQuestionnaireId instead
                        entry.current_questionnaire_id = COMPASSConfig.getDefaultQuestionnaireId();
                    }
                    return entry;
                });
            }

            const questionnaireVersion = '1.0.0';
            const questionnaireId: string =
                nextDataRecording.dataSchemaUrl + '|' + questionnaireVersion;

            // check participation status in study based on defined study dates
            const participationStatus =
                participant.general_study_end_date < new Date() ||
                participant.personal_study_end_date < new Date()
                    ? ParticipationStatus['OffStudy']
                    : ParticipationStatus['OnStudy'];

            // nextInterval and iterationsLeft will be calculated like before
            const distValues = this.calculateStateValues(participant, parameters);

            // clone the object and set updated values
            updatedParticipant.current_instance_id = IdHelper.createID();
            updatedParticipant.current_questionnaire_id = questionnaireId;
            updatedParticipant.start_date = nextDataRecording.scheduledDateTimeUtc;
            updatedParticipant.due_date = nextDataRecording.scheduledDateTimeUtc;
            updatedParticipant.current_interval = distValues.nextInterval;
            updatedParticipant.additional_iterations_left = distValues.additionalIterationsLeft;
            updatedParticipant.status = participationStatus;

            return updatedParticipant;
        });
        return result;
    }

    private async tryGetNextDataRecording(
        participant: ParticipantEntry
    ): Promise<DataRecordingStructure> {
        const drs = await VisitModelHelper.getDataRecordingsForParticipant(participant.subject_uid);
        if (drs.length == 0) {
            return null;
        }
        let result: DataRecordingStructure | null = null;
        drs.forEach((dr) => {
            if (result == null) {
                result = dr;
            } else {
                if (result.scheduledDateTimeUtc > dr.scheduledDateTimeUtc) {
                    result = dr;
                }
            }
        });
        return result;
    }

    private calculateStateValues(
        currentParticipant: ParticipantEntry,
        triggerValues: StateChangeTrigger
    ) {
        // get default values
        const shortInterval = COMPASSConfig.getDefaultShortInterval();

        const regularInterval = COMPASSConfig.getDefaultInterval();

        const shortLimitedQuestionnaireId = COMPASSConfig.getDefaultShortLimitedQuestionnaireId();

        const iterationCount = COMPASSConfig.getDefaultIterationCount();

        if (
            currentParticipant.additional_iterations_left > 0 &&
            currentParticipant.current_questionnaire_id === shortLimitedQuestionnaireId
        ) {
            // Study participant is on short track with limited interval and has iterations left

            const additionalIterationsLeft = currentParticipant.additional_iterations_left;

            return {
                nextInterval: currentParticipant.current_interval,
                additionalIterationsLeft: additionalIterationsLeft
            };
        } else {
            // determine other values
            const switchToShortInterval =
                triggerValues.basicTrigger || triggerValues.specialTrigger;

            const nextInterval = switchToShortInterval ? shortInterval : regularInterval;
            const additionalIterationsLeft = triggerValues.specialTrigger ? iterationCount : 1;

            return {
                nextInterval: nextInterval,
                additionalIterationsLeft: additionalIterationsLeft
            };
        }
    }
}
