
-- Table: apiuser
CREATE TABLE apiuser
(
    api_id character varying(355) NOT NULL,
    api_key character varying(355) NOT NULL,
    api_key_salt character varying(355) NOT NULL,
    CONSTRAINT apiuser_pkey PRIMARY KEY (api_id)
);

-- Table: questionnairehistory
CREATE TABLE questionnairehistory
(
    id character varying(355) NOT NULL,
    subject_id character varying(355) NOT NULL,
    questionnaire_id character varying(355) NOT NULL,
    date_received timestamp without time zone NOT NULL,
    date_sent timestamp without time zone,
    instance_id character varying(355),
    CONSTRAINT questionnairehistory_pkey PRIMARY KEY (id),
    CONSTRAINT questionnairehistory_id_key UNIQUE (id)
);

-- Table: questionnaires
CREATE TABLE questionnaires
(
    id character varying(355) NOT NULL,
    body json NOT NULL,
    CONSTRAINT questionnaires_pkey PRIMARY KEY (id)
);

-- Table: queue
CREATE TABLE queue
(
    id character varying NOT NULL,
    subject_id character varying NOT NULL,
    encrypted_resp text NOT NULL,
    date_sent timestamp without time zone NOT NULL,
    date_received timestamp without time zone NOT NULL,
    downloaded boolean DEFAULT false,
    CONSTRAINT queue_pkey PRIMARY KEY (id)
);

-- Table: studyparticipant
CREATE TABLE studyparticipant
(
    subject_id character varying NOT NULL,
    last_action timestamp without time zone,
    current_questionnaire_id character varying,
    start_date timestamp without time zone,
    due_date timestamp without time zone,
    current_instance_id character varying(355),
    current_interval smallint,
    additional_iterations_left smallint,
    status character varying(9) DEFAULT 'on-study',
    general_study_end_date DATE DEFAULT '9999-12-31',
    personal_study_end_date DATE DEFAULT '9999-12-31',
    CONSTRAINT studyparticipant_pkey PRIMARY KEY (subject_id)
);
