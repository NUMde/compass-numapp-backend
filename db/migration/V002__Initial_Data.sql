-- Create test participant
INSERT INTO studyparticipant (subject_id) VALUES('7bfc3b07-a97d-4e11-8ac6-b970c1745476');
INSERT INTO studyparticipant (subject_id) VALUES('dd06747c-03df-4adb-9dbb-90b38dccab16');

-- Create test questionnaires
INSERT INTO questionnaires (id,body) VALUES
('initial','{
    "resourceType": "Questionnaire",
    "url": "http://hl7.org/fhir/Questionnaire/Fragebogen_COMPASS_Beispiel",
    "identifier": [{
        "use": "official",
        "system": "urn:UMOID:",
        "value": "Fragebogen COMPASS Beispiel Initial"
    }],
    "version": "1.2",
    "title": "Fragebogen COMPASS Beispiel Initial",
    "status": "draft",
    "subjectType": [
        "Patient"
    ],
    "date": "2021-01-25",
    "publisher": "IBM",
    "purpose": "Abbildung der aktuell in der von IBM entwickelten App unterstützten FHIR Funktionalitäten - Initial",
    "item": [{
        "linkId": "1",
        "text": "Fragegruppe 1",
        "type": "group",
        "required": true,
        "item": [{
                "linkId": "1.1",
                "text": "Das ist eine Freitextabfrage",
                "type": "string",
                "required": true
            },
            {
                "linkId": "1.2",
                "text": "Das ist eine Datumsabfrage",
                "type": "date",
                "required": true
            },
            {
                "linkId": "1.3",
                "text": "Das ist eine Dezimalzahlenabfrage",
                "type": "decimal",
                "required": true
            },
            {
                "linkId": "1.4",
                "text": "Das ist eine Ganzzahlenabfrage",
                "type": "integer",
                "required": true
            },
            {
                "linkId": "1.5",
                "text": "Das ist eine boolsche Abfrage",
                "type": "boolean",
                "required": true
            },
            {
                "linkId": "1.6",
                "text": "Das ist eine informative Anzeige ohne Abfrage",
                "type": "display",
                "required": true
            }, {
                "linkId": "1.7",
                "text": "Das ist eine Slider-Abfrage",
                "type": "integer",
                "extension": [{
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                        "valueCodeableConcept": {
                            "coding": [{
                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                "code": "slider"
                            }]
                        }
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-lowRangeLabel",
                        "valueString": "Niedrig"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-highRangeLabel",
                        "valueString": "Hoch"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-sliderStepValue",
                        "valueInteger": 1
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/minValue",
                        "valueInteger": 0
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/maxValue",
                        "valueInteger": 10
                    }
                ],
                "required": true
            },
            {
                "linkId": "1.8",
                "text": "Das ist eine optionale Frage",
                "type": "string",
                "required": false
            },
            {
                "linkId": "1.9",
                "text": "Das ist eine alternative Art eine Multiple-Choice-Abfrage abzubilden",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.9.1",
                        "text": "Option A",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.2",
                        "text": "Option B",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.3",
                        "text": "Option C",
                        "type": "boolean",
                        "required": true
                    }
                ]
            },
            {
                "linkId": "1.10",
                "text": "Das ist eine Single-Choice-Abfrage",
                "type": "choice",
                "required": true,
                "answerOption": [{
                        "valueString": "Option A"
                    },
                    {
                        "valueString": "Option B"
                    },
                    {
                        "valueString": "Option C"
                    }
                ]
            },
            {
                "linkId": "1.11",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }]
            },
            {
                "linkId": "1.13",
                "linkId": "1.12",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 oder 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "any"
            },
            {
                "linkId": "1.13",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 und 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "all"
            },
            {
                "linkId": "1.14",
                "text": "Bedingte Abfrage mit answerDecimal",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.14.1",
                        "text": "Abfrage Dezimalzahl (erwartet = 1.5)",
                        "type": "decimal",
                        "required": true
                    },
                    {
                        "linkId": "1.14.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.14.1",
                            "operator": "=",
                            "answerDecimal": 1.5
                        }]
                    }
                ]
            },
            {
                "linkId": "1.15",
                "text": "Bedingte Abfrage mit answerInteger",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.15.1",
                        "text": "Abfrage Ganzzahl (erwartet = 1)",
                        "type": "integer",
                        "required": true
                    },
                    {
                        "linkId": "1.15.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.15.1",
                            "operator": "=",
                            "answerInteger": 1
                        }]
                    }
                ]
            },
            {
                "linkId": "1.16",
                "text": "Bedingte Abfrage mit answerDate",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.16.1",
                        "text": "Abfrage Datum (erwartet = 01.01.2021)",
                        "type": "date",
                        "required": true
                    },
                    {
                        "linkId": "1.16.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.16.1",
                            "operator": "=",
                            "answerDate": "2021-01-01"
                        }]
                    }
                ]
            },
            {
                "linkId": "1.17",
                "text": "Das ist eine Frage mit Definition",
                "type": "string",
                "required": true,
                "definition": "http://loinc.org/example#uri"
            },
            {
                "linkId": "1.18",
                "text": "Das ist eine Frage mit max. Eingabelänge von 10 Zeichen",
                "type": "string",
                "required": true,
                "maxLength": 10
            }
        ]
    }, {
        "linkId": "2",
        "text": "Fragegruppe 2",
        "type": "group",
        "required": true,
        "item": [{
            "linkId": "2.1",
            "text": "Untergruppe 1",
            "type": "group",
            "required": true,
            "item": [{
                    "linkId": "2.1.1",
                    "text": "Untergruppe 2",
                    "type": "group",
                    "required": true,
                    "item": [{
                            "linkId": "2.1.1.1",
                            "text": "Frage der Untergruppe 2",
                            "type": "string",
                            "required": true
                        },
                        {
                            "linkId": "2.1.1.2",
                            "text": "Untergruppe 3",
                            "type": "group",
                            "required": true,
                            "item": [{
                                    "linkId": "2.1.1.2.1",
                                    "text": "Frage 1 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "linkId": "2.1.1.2.2",
                                    "text": "Frage 2 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "linkId": "2.1.2",
                    "text": "Frage der Untergruppe 1",
                    "type": "boolean",
                    "required": true
                }
            ]
        }]
    }]
}')
,('q_1.0','{
    "resourceType": "Questionnaire",
    "url": "http://hl7.org/fhir/Questionnaire/Fragebogen_COMPASS_Beispiel",
    "identifier": [{
        "use": "official",
        "system": "urn:UMOID:",
        "value": "Fragebogen COMPASS Beispiel A"
    }],
    "version": "1.2",
    "title": "Fragebogen COMPASS Beispiel A",
    "status": "draft",
    "subjectType": [
        "Patient"
    ],
    "date": "2021-01-25",
    "publisher": "IBM",
    "purpose": "Abbildung der aktuell in der von IBM entwickelten App unterstützten FHIR Funktionalitäten - A",
    "item": [{
        "linkId": "1",
        "text": "Fragegruppe 1",
        "type": "group",
        "required": true,
        "item": [{
                "linkId": "1.1",
                "text": "Das ist eine Freitextabfrage",
                "type": "string",
                "required": true
            },
            {
                "linkId": "1.2",
                "text": "Das ist eine Datumsabfrage",
                "type": "date",
                "required": true
            },
            {
                "linkId": "1.3",
                "text": "Das ist eine Dezimalzahlenabfrage",
                "type": "decimal",
                "required": true
            },
            {
                "linkId": "1.4",
                "text": "Das ist eine Ganzzahlenabfrage",
                "type": "integer",
                "required": true
            },
            {
                "linkId": "1.5",
                "text": "Das ist eine boolsche Abfrage",
                "type": "boolean",
                "required": true
            },
            {
                "linkId": "1.6",
                "text": "Das ist eine informative Anzeige ohne Abfrage",
                "type": "display",
                "required": true
            }, {
                "linkId": "1.7",
                "text": "Das ist eine Slider-Abfrage",
                "type": "integer",
                "extension": [{
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                        "valueCodeableConcept": {
                            "coding": [{
                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                "code": "slider"
                            }]
                        }
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-lowRangeLabel",
                        "valueString": "Niedrig"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-highRangeLabel",
                        "valueString": "Hoch"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-sliderStepValue",
                        "valueInteger": 1
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/minValue",
                        "valueInteger": 0
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/maxValue",
                        "valueInteger": 10
                    }
                ],
                "required": true
            },
            {
                "linkId": "1.8",
                "text": "Das ist eine optionale Frage",
                "type": "string",
                "required": false
            },
            {
                "linkId": "1.9",
                "text": "Das ist eine alternative Art eine Multiple-Choice-Abfrage abzubilden",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.9.1",
                        "text": "Option A",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.2",
                        "text": "Option B",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.3",
                        "text": "Option C",
                        "type": "boolean",
                        "required": true
                    }
                ]
            },
            {
                "linkId": "1.10",
                "text": "Das ist eine Single-Choice-Abfrage",
                "type": "choice",
                "required": true,
                "answerOption": [{
                        "valueString": "Option A"
                    },
                    {
                        "valueString": "Option B"
                    },
                    {
                        "valueString": "Option C"
                    }
                ]
            },
            {
                "linkId": "1.11",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }]
            },
            {
                "linkId": "1.12",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 oder 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "any"
            },
            {
                "linkId": "1.13",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 und 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "all"
            },
            {
                "linkId": "1.14",
                "text": "Bedingte Abfrage mit answerDecimal",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.14.1",
                        "text": "Abfrage Dezimalzahl (erwartet = 1.5)",
                        "type": "decimal",
                        "required": true
                    },
                    {
                        "linkId": "1.14.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.14.1",
                            "operator": "=",
                            "answerDecimal": 1.5
                        }]
                    }
                ]
            },
            {
                "linkId": "1.15",
                "text": "Bedingte Abfrage mit answerInteger",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.15.1",
                        "text": "Abfrage Ganzzahl (erwartet = 1)",
                        "type": "integer",
                        "required": true
                    },
                    {
                        "linkId": "1.15.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.15.1",
                            "operator": "=",
                            "answerInteger": 1
                        }]
                    }
                ]
            },
            {
                "linkId": "1.16",
                "text": "Bedingte Abfrage mit answerDate",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.16.1",
                        "text": "Abfrage Datum (erwartet = 01.01.2021)",
                        "type": "date",
                        "required": true
                    },
                    {
                        "linkId": "1.16.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.16.1",
                            "operator": "=",
                            "answerDate": "2021-01-01"
                        }]
                    }
                ]
            },
            {
                "linkId": "1.17",
                "text": "Das ist eine Frage mit Definition",
                "type": "string",
                "required": true,
                "definition": "http://loinc.org/example#uri"
            },
            {
                "linkId": "1.18",
                "text": "Das ist eine Frage mit max. Eingabelänge von 10 Zeichen",
                "type": "string",
                "required": true,
                "maxLength": 10
            }
        ]
    }, {
        "linkId": "2",
        "text": "Fragegruppe 2",
        "type": "group",
        "required": true,
        "item": [{
            "linkId": "2.1",
            "text": "Untergruppe 1",
            "type": "group",
            "required": true,
            "item": [{
                    "linkId": "2.1.1",
                    "text": "Untergruppe 2",
                    "type": "group",
                    "required": true,
                    "item": [{
                            "linkId": "2.1.1.1",
                            "text": "Frage der Untergruppe 2",
                            "type": "string",
                            "required": true
                        },
                        {
                            "linkId": "2.1.1.2",
                            "text": "Untergruppe 3",
                            "type": "group",
                            "required": true,
                            "item": [{
                                    "linkId": "2.1.1.2.1",
                                    "text": "Frage 1 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "linkId": "2.1.1.2.2",
                                    "text": "Frage 2 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "linkId": "2.1.2",
                    "text": "Frage der Untergruppe 1",
                    "type": "boolean",
                    "required": true
                }
            ]
        }]
    }]
}')
,('fedaf08b-aae2-4d9b-8306-8a3de02d2f74','{
    "resourceType": "Questionnaire",
    "url": "http://hl7.org/fhir/Questionnaire/Fragebogen_COMPASS_Beispiel",
    "identifier": [{
        "use": "official",
        "system": "urn:UMOID:",
        "value": "Fragebogen COMPASS Beispiel B"
    }],
    "version": "1.2",
    "title": "Fragebogen COMPASS Beispiel B",
    "status": "draft",
    "subjectType": [
        "Patient"
    ],
    "date": "2021-01-25",
    "publisher": "IBM",
    "purpose": "Abbildung der aktuell in der von IBM entwickelten App unterstützten FHIR Funktionalitäten - B",
    "item": [{
        "linkId": "1",
        "text": "Fragegruppe 1",
        "type": "group",
        "required": true,
        "item": [{
                "linkId": "1.1",
                "text": "Das ist eine Freitextabfrage",
                "type": "string",
                "required": true
            },
            {
                "linkId": "1.2",
                "text": "Das ist eine Datumsabfrage",
                "type": "date",
                "required": true
            },
            {
                "linkId": "1.3",
                "text": "Das ist eine Dezimalzahlenabfrage",
                "type": "decimal",
                "required": true
            },
            {
                "linkId": "1.4",
                "text": "Das ist eine Ganzzahlenabfrage",
                "type": "integer",
                "required": true
            },
            {
                "linkId": "1.5",
                "text": "Das ist eine boolsche Abfrage",
                "type": "boolean",
                "required": true
            },
            {
                "linkId": "1.6",
                "text": "Das ist eine informative Anzeige ohne Abfrage",
                "type": "display",
                "required": true
            }, {
                "linkId": "1.7",
                "text": "Das ist eine Slider-Abfrage",
                "type": "integer",
                "extension": [{
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                        "valueCodeableConcept": {
                            "coding": [{
                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                "code": "slider"
                            }]
                        }
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-lowRangeLabel",
                        "valueString": "Niedrig"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-highRangeLabel",
                        "valueString": "Hoch"
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-sliderStepValue",
                        "valueInteger": 1
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/minValue",
                        "valueInteger": 0
                    },
                    {
                        "url": "http://hl7.org/fhir/StructureDefinition/maxValue",
                        "valueInteger": 10
                    }
                ],
                "required": true
            },
            {
                "linkId": "1.8",
                "text": "Das ist eine optionale Frage",
                "type": "string",
                "required": false
            },
            {
                "linkId": "1.9",
                "text": "Das ist eine alternative Art eine Multiple-Choice-Abfrage abzubilden",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.9.1",
                        "text": "Option A",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.2",
                        "text": "Option B",
                        "type": "boolean",
                        "required": true
                    },
                    {
                        "linkId": "1.9.3",
                        "text": "Option C",
                        "type": "boolean",
                        "required": true
                    }
                ]
            },
            {
                "linkId": "1.10",
                "text": "Das ist eine Single-Choice-Abfrage",
                "type": "choice",
                "required": true,
                "answerOption": [{
                        "valueString": "Option A"
                    },
                    {
                        "valueString": "Option B"
                    },
                    {
                        "valueString": "Option C"
                    }
                ]
            },
            {
                "linkId": "1.11",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }]
            },
            {
                "linkId": "1.12",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 oder 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "any"
            },
            {
                "linkId": "1.13",
                "text": "Diese Frage wird nur angezeigt, wenn 1.10 und 1.9.1 mit \"Option A\" beantwortet wurde",
                "type": "string",
                "required": true,
                "enableWhen": [{
                    "question": "1.9.1",
                    "operator": "=",
                    "answerBoolean": true
                }, {
                    "question": "1.10",
                    "operator": "=",
                    "answerString": "Option A"
                }],
                "enableBehavior": "all"
            },
            {
                "linkId": "1.14",
                "text": "Bedingte Abfrage mit answerDecimal",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.14.1",
                        "text": "Abfrage Dezimalzahl (erwartet = 1.5)",
                        "type": "decimal",
                        "required": true
                    },
                    {
                        "linkId": "1.14.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.14.1",
                            "operator": "=",
                            "answerDecimal": 1.5
                        }]
                    }
                ]
            },
            {
                "linkId": "1.15",
                "text": "Bedingte Abfrage mit answerInteger",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.15.1",
                        "text": "Abfrage Ganzzahl (erwartet = 1)",
                        "type": "integer",
                        "required": true
                    },
                    {
                        "linkId": "1.15.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.15.1",
                            "operator": "=",
                            "answerInteger": 1
                        }]
                    }
                ]
            },
            {
                "linkId": "1.16",
                "text": "Bedingte Abfrage mit answerDate",
                "type": "group",
                "required": true,
                "item": [{
                        "linkId": "1.16.1",
                        "text": "Abfrage Datum (erwartet = 01.01.2021)",
                        "type": "date",
                        "required": true
                    },
                    {
                        "linkId": "1.16.2",
                        "text": "Diese Frage wird nur bei erwarteter Eingabe angezeigt",
                        "type": "string",
                        "required": true,
                        "enableWhen": [{
                            "question": "1.16.1",
                            "operator": "=",
                            "answerDate": "2021-01-01"
                        }]
                    }
                ]
            },
            {
                "linkId": "1.17",
                "text": "Das ist eine Frage mit Definition",
                "type": "string",
                "required": true,
                "definition": "http://loinc.org/example#uri"
            },
            {
                "linkId": "1.18",
                "text": "Das ist eine Frage mit max. Eingabelänge von 10 Zeichen",
                "type": "string",
                "required": true,
                "maxLength": 10
            }
        ]
    }, {
        "linkId": "2",
        "text": "Fragegruppe 2",
        "type": "group",
        "required": true,
        "item": [{
            "linkId": "2.1",
            "text": "Untergruppe 1",
            "type": "group",
            "required": true,
            "item": [{
                    "linkId": "2.1.1",
                    "text": "Untergruppe 2",
                    "type": "group",
                    "required": true,
                    "item": [{
                            "linkId": "2.1.1.1",
                            "text": "Frage der Untergruppe 2",
                            "type": "string",
                            "required": true
                        },
                        {
                            "linkId": "2.1.1.2",
                            "text": "Untergruppe 3",
                            "type": "group",
                            "required": true,
                            "item": [{
                                    "linkId": "2.1.1.2.1",
                                    "text": "Frage 1 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "linkId": "2.1.1.2.2",
                                    "text": "Frage 2 der Untergruppe 3",
                                    "type": "string",
                                    "required": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "linkId": "2.1.2",
                    "text": "Frage der Untergruppe 1",
                    "type": "boolean",
                    "required": true
                }
            ]
        }]
    }]
}')
;
