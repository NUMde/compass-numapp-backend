import {
    SubjectFilter,
    UidFieldFilter,
    StringFieldFilter,
    UidValueCriteria
} from 'orscf-subjectdata-contract';
import { VisitFilter } from 'orscf-visitdata-contract';

export class SearchFilterService {
    public static buildSubjectFilterSqlClause(filter: SubjectFilter, varName: string): string {
        let result = '';
        result = SearchFilterService.appendAndFilter(result, SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid'));
        result = SearchFilterService.appendAndFilter(result, SearchFilterService.buildUidClause(filter.siteUid, varName, 'actual_site_uid'));
        if(result != '') result = 'where ' + result;
        return result;
    }

    public static buildVisitFilterSqlClause(filter: VisitFilter, minTimestampUtc: number, varName: string): string {
        let result = '';
        if(minTimestampUtc !== null){
           result = SearchFilterService.appendAndFilter(result, `modification_timestamp_utc >= ${minTimestampUtc}`);
        }
        result = SearchFilterService.appendAndFilter(result, SearchFilterService.buildUidClause(filter.studyUid, varName, 'study_uid'));
        result = SearchFilterService.appendAndFilter(result, SearchFilterService.buildUidClause(filter.siteUid, varName, 'site_uid'));
        if(result != '') result = 'where ' + result;
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

    public static appendAndFilter(current: string, append: string): string {
        if(current == null || current == ''){
            if(append == null || append == '') return ''
            else return append
        }
        else {
            if(append == null || append == '') return current
            else return append + ' and ' + current
        }
    }

}
