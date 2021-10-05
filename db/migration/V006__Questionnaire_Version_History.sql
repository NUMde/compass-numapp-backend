-- Table: questionnaire_version_history
CREATE TABLE questionnaire_version_history
(
    id character varying(355) NOT NULL,
    url character varying(355) NOT NULL,
    version character varying(355) NOT NULL,
    name character varying(355) NOT NULL,
    body json NOT NULL,
    CONSTRAINT questionnaire_version_history_pkey PRIMARY KEY (id),
    CONSTRAINT fk_name FOREIGN KEY (name) REFERENCES questionnaires(id)
);
