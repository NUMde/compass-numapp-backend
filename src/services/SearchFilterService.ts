import {
    SubjectFilter,
    UidFieldFilter,
    StringFieldFilter,
    UidValueCriteria
} from 'orscf-subjectdata-contract';
import { VisitFilter } from 'orscf-visitdata-contract';

export class SearchFilterService {
    public static buildSubjectFilterSqlClause(filter: SubjectFilter, varName: string): string {
        let result = '1 = 1';

        result +=
            ' and ' + SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid');
        result +=
            ' and ' +
            SearchFilterService.buildUidClause(filter.siteUid, varName, 'actual_site_uid');

        return result;
    }

    public static buildVisitFilterSqlClause(filter: VisitFilter, varName: string): string {
        let result = '1 = 1';

        result +=
            ' and ' + SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid');
        result += ' and ' + SearchFilterService.buildUidClause(filter.siteUid, varName, 'site_uid');

        return result;
    }

    private static buildUidClause(
        uidFilter: UidFieldFilter | undefined,
        sqlVarName: string,
        sqlFieldName: string
    ): string {
        let result = '';

        if (uidFilter == undefined || uidFilter == null) {
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
}
