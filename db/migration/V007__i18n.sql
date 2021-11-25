-- Add a language code to the needed places

-- Table: questionnaires
ALTER TABLE questionnaires ADD language_code varchar NOT NULL DEFAULT 'de';
COMMENT ON COLUMN questionnaires.language_code IS 'The language the questionnaire is written in. Stored as ISO-639-1 code.';

ALTER TABLE questionnaire_version_history DROP CONSTRAINT fk_name;
ALTER TABLE questionnaires DROP CONSTRAINT questionnaires_pkey;
ALTER TABLE questionnaires ADD CONSTRAINT questionnaires_pkey PRIMARY KEY (id,language_code);

-- Table: studyparticipant
ALTER TABLE studyparticipant ADD language_code varchar NOT NULL DEFAULT 'de';

-- Table: questionnaire_version_history
ALTER TABLE questionnaire_version_history ADD language_code varchar NOT NULL DEFAULT 'de';
ALTER TABLE questionnaire_version_history DROP CONSTRAINT questionnaire_version_history_pkey;
ALTER TABLE questionnaire_version_history ADD CONSTRAINT questionnaire_version_history_pkey PRIMARY KEY (id,language_code);
ALTER TABLE questionnaire_version_history ADD CONSTRAINT questionnaire_version_history_fk FOREIGN KEY (name,language_code) REFERENCES public.questionnaires(id,language_code);

-- Table: queue
-- TODO decide, if the language should be stored in the queue table as well
-- ALTER TABLE queue ADD language_code varchar NOT NULL DEFAULT 'de';

-- Table: questionnairehistory
ALTER TABLE questionnairehistory ADD language_code varchar NOT NULL DEFAULT 'de';
