CREATE TABLE visits
(
    id character varying(355) NOT NULL,

    study_uid character varying(355) NOT NULL,
    site_uid character varying(355) NOT NULL,
    subject_identifier character varying(355) NOT NULL,
    modification_timestamp_utc int NOT NULL,

    visit_procedure_name character varying(355) NOT NULL,
    visit_execution_title character varying(355) NOT NULL,
    scheduled_date_utc timestamp without time zone NULL,
    execution_date_utc timestamp without time zone NULL,
    execution_state int NOT NULL,
    execution_person character varying(355) NOT NULL,
    CONSTRAINT visits_pkey PRIMARY KEY (id),
    CONSTRAINT visits_id_key UNIQUE (id)
);

CREATE TABLE datarecordings
(
    id character varying(355) NOT NULL,

    modification_timestamp_utc int NOT NULL,

    data_recording_name character varying(355) NOT NULL,
    task_execution_title character varying(355) NOT NULL,
    scheduled_date_utc timestamp without time zone NULL,
    execution_date_utc timestamp without time zone NULL,
    execution_state int NOT NULL,
    data_scheme_url character varying(355) NOT NULL,
    notes_regarding_outcome character varying(355) NOT NULL,
    execution_person character varying(355) NOT NULL,

    visit_id character varying(355) NOT NULL,

    recorded_data character varying(355) NOT NULL,
    CONSTRAINT datarecordings_pkey PRIMARY KEY (id),
    CONSTRAINT datarecordings_id_key UNIQUE (id),
    CONSTRAINT fk_visit
      FOREIGN KEY(visit_id)
	  REFERENCES visits(id)

)
