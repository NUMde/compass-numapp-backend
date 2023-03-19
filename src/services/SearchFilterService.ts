import {
    SubjectFilter,
    UidFieldFilter,
    StringFieldFilter,
    UidValueCriteria,
    DateValueCriteria
} from 'orscf-subjectdata-contract';
import {
    DateFieldFilter,
    IntegerFieldFilter,
    IntegerValueCriteria,
    RangeMatchingBehaviour,
    VisitFilter
} from 'orscf-visitdata-contract';

export class SearchFilterService {
    public static buildSubjectFilterSqlClause(filter: SubjectFilter, varName: string): string {
        let result = '';

        // uids
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildUidClause(filter.siteUid, varName, 'actual_site_uid')
        );

        // strings
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(filter.subjectIdentifier, varName, 'subject_uid')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(filter.status, varName, 'status')
        );
        // result = SearchFilterService.appendAndFilter(
        //     result,
        //     SearchFilterService.buildStringClause(filter.assignedArm, varName, 'assigned_arm')
        // );
        // result = SearchFilterService.appendAndFilter(
        //     result,
        //     SearchFilterService.buildStringClause(filter.actualArm, varName, 'actual_arm')
        // );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(filter.substudyName, varName, 'status')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(
                filter.actualSiteDefinedPatientIdentifier,
                varName,
                'actual_site_defined_patient_identifier'
            )
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildDateClause(filter.periodStart, varName, 'start_date')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildDateClause(filter.periodEnd, varName, 'due_date')
        );

        // dates

        if (result != '') result = 'where ' + result;
        return result;
    }

    public static buildVisitFilterSqlClause(
        filter: VisitFilter,
        minTimestampUtc: number,
        varName: string
    ): string {
        let result = '';
        if (minTimestampUtc !== null) {
            result = SearchFilterService.appendAndFilter(
                result,
                `modification_timestamp_utc >= ${minTimestampUtc}`
            );
        }
        // uids
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildUidClause(filter.siteUid, varName, 'site_uid')
        );

        // strings
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(
                filter.subjectIdentifier,
                varName,
                'subject_identifier'
            )
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(
                filter.visitProcedureName,
                varName,
                'visit_procedure_name'
            )
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(
                filter.subjectIdentifier,
                varName,
                'subject_identifier'
            )
        );

        // integers
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildIntegerClause(
                filter.executionState,
                varName,
                'execution_state'
            )
        );

        // dates
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildDateClause(
                filter.scheduledDateUtc,
                varName,
                'scheduled_date_utc'
            )
        );

        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildDateClause(
                filter.executionDateUtc,
                varName,
                'execution_date_utc'
            )
        );

        if (result != '') result = 'where ' + result;
        return result;
    }

    public static buildVisitFilterSqlClause_QuestionnaireHistory(
        filter: VisitFilter,
        minTimestampUtc: number,
        varName: string
    ): string {
        let result = '';

        // uids
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildUidClause(filter.studyUid, varName, 'instance_id')
        );

        // strings
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(filter.subjectIdentifier, varName, 'subject_id')
        );
        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildStringClause(
                filter.visitProcedureName,
                varName,
                'questionnaire_id'
            )
        );

        // integers

        // dates

        result = SearchFilterService.appendAndFilter(
            result,
            SearchFilterService.buildDateClause(filter.executionDateUtc, varName, 'date_received')
        );

        if (result != '') result = 'where ' + result;
        return result;
    }

    private static buildUidClause(
        uidFilter: UidFieldFilter | undefined,
        sqlVarName: string,
        sqlFieldName: string
    ): string {
        let result = '';

        if (uidFilter == undefined) {
            return '';
        }
        let equalities = '';
        let inequalities = '';
        let i = 0;
        const includedValues: UidValueCriteria[] = uidFilter.negate
            ? uidFilter.excludedValues
            : uidFilter.includedValues;
        const excludedValues: UidValueCriteria[] = uidFilter.negate
            ? uidFilter.includedValues
            : uidFilter.excludedValues;
        includedValues?.forEach((iv) => {
            let eq = '';
            if (i > 0) {
                eq = ' or ';
            }
            if (iv.value == null) {
                eq += `${sqlVarName}.${sqlFieldName} is null`;
            } else {
                eq += `${sqlVarName}.${sqlFieldName} = '${iv.value}'`;
            }
            equalities += eq;
            i++;
        });
        i = 0;
        excludedValues?.forEach((iv) => {
            let ieq = '';
            if (i > 0) {
                ieq = ' or ';
            }
            if (iv.value == null) {
                ieq += `${sqlVarName}.${sqlFieldName} not null`;
            } else {
                ieq += `${sqlVarName}.${sqlFieldName} <> '${iv.value}'`;
            }
            inequalities += ieq;
            i++;
        });
        if (equalities.length > 0 && inequalities.length > 0) {
            result = `((${equalities}) and (${inequalities}))`;
        }
        if (equalities.length > 0 && inequalities.length == 0) {
            result = `(${equalities})`;
        }
        if (equalities.length == 0 && inequalities.length > 0) {
            result = `(${inequalities})`;
        }

        return result;
    }

    private static buildStringClause(
        stringFilter: StringFieldFilter | undefined,
        sqlVarName: string,
        sqlFieldName: string
    ): string {
        let result = '';

        if (stringFilter == undefined) {
            return '';
        }
        let equalities = '';
        let inequalities = '';
        let i = 0;
        const includedValues: UidValueCriteria[] = stringFilter.negate
            ? stringFilter.excludedValues
            : stringFilter.includedValues;
        const excludedValues: UidValueCriteria[] = stringFilter.negate
            ? stringFilter.includedValues
            : stringFilter.excludedValues;
        includedValues?.forEach((iv) => {
            let eq = '';
            if (i > 0) {
                eq = ' or ';
            }
            if (iv.value == null) {
                eq += `${sqlVarName}.${sqlFieldName} is null`;
            } else {
                if (stringFilter.ignoreCasing) {
                    eq += `lower(${sqlVarName}.${sqlFieldName}) = '${iv.value.toLowerCase()}'`;
                } else {
                    eq += `${sqlVarName}.${sqlFieldName} = '${iv.value}'`;
                }
            }
            equalities += eq;
            i++;
        });
        i = 0;
        excludedValues?.forEach((iv) => {
            let ieq = '';
            if (i > 0) {
                ieq = ' or ';
            }
            if (iv.value == null) {
                ieq += `${sqlVarName}.${sqlFieldName} not null`;
            } else {
                if (stringFilter.ignoreCasing) {
                    ieq += `lower(${sqlVarName}.${sqlFieldName}) <> '${iv.value.toLowerCase()}'`;
                } else {
                    ieq += `${sqlVarName}.${sqlFieldName} <> '${iv.value}'`;
                }
            }
            inequalities += ieq;
            i++;
        });
        if (equalities.length > 0 && inequalities.length > 0) {
            result = `((${equalities}) and (${inequalities}))`;
        }
        if (equalities.length > 0 && inequalities.length == 0) {
            result = `(${equalities})`;
        }
        if (equalities.length == 0 && inequalities.length > 0) {
            result = `(${inequalities})`;
        }

        return result;
    }

    private static buildIntegerClause(
        filter: IntegerFieldFilter | undefined,
        sqlVarName: string,
        sqlFieldName: string
    ): string {
        let result = '';

        if (filter == undefined) {
            return '';
        }
        let includeCriterias = '';
        let excludeCriterias = '';

        let i = 0;
        const includedValues: IntegerValueCriteria[] = filter.negate
            ? filter.excludedValues
            : filter.includedValues;
        const excludedValues: IntegerValueCriteria[] = filter.negate
            ? filter.includedValues
            : filter.excludedValues;

        includedValues?.forEach((iv) => {
            let c = '';
            if (i > 0) {
                c = ' or ';
            }
            switch (iv.matchingBehaviour) {
                case RangeMatchingBehaviour.Equal:
                    c += `${sqlVarName}.${sqlFieldName} = ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.Less:
                    c += `${sqlVarName}.${sqlFieldName} < ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.LessOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} <= ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.More:
                    c += `${sqlVarName}.${sqlFieldName} > ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.MoreOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} >= ${iv.value}`;
                    break;
            }
            includeCriterias += c;
            i++;
        });
        i = 0;
        excludedValues?.forEach((iv) => {
            let c = '';
            if (i > 0) {
                c = ' or ';
            }
            switch (iv.matchingBehaviour) {
                case RangeMatchingBehaviour.Equal:
                    c += `${sqlVarName}.${sqlFieldName} <> ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.Less:
                    c += `${sqlVarName}.${sqlFieldName} >= ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.LessOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} > ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.More:
                    c += `${sqlVarName}.${sqlFieldName} <= ${iv.value}`;
                    break;
                case RangeMatchingBehaviour.MoreOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} < ${iv.value}`;
                    break;
            }
            excludeCriterias += c;
            i++;
        });
        if (includeCriterias.length > 0 && excludeCriterias.length > 0) {
            result = `((${includeCriterias}) and (${excludeCriterias}))`;
        }
        if (includeCriterias.length > 0 && excludeCriterias.length == 0) {
            result = `(${includeCriterias})`;
        }
        if (includeCriterias.length == 0 && excludeCriterias.length > 0) {
            result = `(${excludeCriterias})`;
        }

        return result;
    }

    private static buildDateClause(
        filter: DateFieldFilter | undefined,
        sqlVarName: string,
        sqlFieldName: string
    ): string {
        let result = '';

        if (filter == undefined) {
            return '';
        }
        let includeCriterias = '';
        let excludeCriterias = '';

        let i = 0;
        const includedValues: DateValueCriteria[] = filter.negate
            ? filter.excludedValues
            : filter.includedValues;
        const excludedValues: DateValueCriteria[] = filter.negate
            ? filter.includedValues
            : filter.excludedValues;

        includedValues?.forEach((iv) => {
            let c = '';
            if (i > 0) {
                c = ' or ';
            }
            switch (iv.matchingBehaviour) {
                case RangeMatchingBehaviour.Equal:
                    c += `${sqlVarName}.${sqlFieldName} = '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.Less:
                    c += `${sqlVarName}.${sqlFieldName} < '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.LessOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} <= '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.More:
                    c += `${sqlVarName}.${sqlFieldName} > '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.MoreOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} >= '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
            }
            includeCriterias += c;
            i++;
        });
        i = 0;
        excludedValues?.forEach((iv) => {
            let c = '';
            if (i > 0) {
                c = ' or ';
            }
            switch (iv.matchingBehaviour) {
                case RangeMatchingBehaviour.Equal:
                    c += `${sqlVarName}.${sqlFieldName} <> '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.Less:
                    c += `${sqlVarName}.${sqlFieldName} >= '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.LessOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} > '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.More:
                    c += `${sqlVarName}.${sqlFieldName} <= '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
                case RangeMatchingBehaviour.MoreOrEqual:
                    c += `${sqlVarName}.${sqlFieldName} < '${SearchFilterService.ToSqlDateString(
                        iv.value
                    )}'`;
                    break;
            }
            excludeCriterias += c;
            i++;
        });
        if (includeCriterias.length > 0 && excludeCriterias.length > 0) {
            result = `((${includeCriterias}) and (${excludeCriterias}))`;
        }
        if (includeCriterias.length > 0 && excludeCriterias.length == 0) {
            result = `(${includeCriterias})`;
        }
        if (includeCriterias.length == 0 && excludeCriterias.length > 0) {
            result = `(${excludeCriterias})`;
        }

        return result;
    }

    static ToSqlDateString(value: Date): string {
        const d = new Date(value);
        return d.toUTCString();
    }

    public static appendAndFilter(current: string, append: string): string {
        if (current == null || current == '') {
            if (append == null || append == '') return '';
            else return append;
        } else {
            if (append == null || append == '') return current;
            else return append + ' and ' + current;
        }
    }
}
