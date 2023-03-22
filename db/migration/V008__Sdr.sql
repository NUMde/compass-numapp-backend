-- Add column to store device token for Firebase push notifications
ALTER TABLE
    studyparticipant
ADD
    COLUMN subject_uid character varying NULL,
ADD
    COLUMN study_uid character varying NULL,
ADD
    COLUMN actual_site_uid character varying NULL,
ADD
    COLUMN enrolling_site_uid character varying NULL,
ADD
    COLUMN actual_site_defined_patient_identifier character varying NULL;
