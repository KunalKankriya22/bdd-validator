---
tags:
  - table
  - UTIL
---
# SERVER_PARAMETERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3
**Last Analyzed**: 2025-09-16 03:16:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PARAMETER_CODE | VARCHAR2(50) | Yes |  |  |
| 2 | PARAMETER_VALUE | VARCHAR2(240) | Yes |  |  |
| 3 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| SRW_CALL_REPORT_DONOR | PACKAGE | UTIL |
| SRW_CALL_REPORT_LAB | PACKAGE | UTIL |
| SRW_CALL_REPORT_RSM | PACKAGE | UTIL |
