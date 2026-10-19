---
tags:
  - table
  - UTIL
---
# RPT_PARM

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 174
**Last Analyzed**: 2026-05-23 11:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | USER_NAME | VARCHAR2(30) | No |  |  |
| 3 | REPORT_NAME | VARCHAR2(8) | No |  |  |
| 4 | PARM_ID | VARCHAR2(50) | No |  |  |
| 5 | RECURRENT | VARCHAR2(1) | Yes |  |  |
| 6 | PARM_DATE | DATE | No |  |  |
| 7 | AUTO_PRINT_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | DELETE_AFTER_PRINT_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | HEADER_AND_TRAILER_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | NO_OF_COPIES | VARCHAR2(2) | Yes |  |  |
| 11 | FORMS_TYPE | VARCHAR2(15) | Yes |  |  |
| 12 | PRINT_ID | VARCHAR2(25) | Yes |  |  |
| 13 | PRIORITY | NUMBER(2) | Yes |  |  |
| 14 | SUBMIT_DATE | DATE | Yes |  |  |
| 15 | START_TIME | DATE | Yes |  |  |
| 16 | FORMAT_MASK | VARCHAR2(30) | Yes |  |  |
| 17 | FORMAT_MASK_VALUE | VARCHAR2(30) | Yes |  |  |
| 18 | EXECUTION_DATE | DATE | Yes |  |  |
| 19 | END_DATE | DATE | Yes |  |  |
| 20 | UNIX_PID | NUMBER | Yes |  |  |
| 21 | REPORT_STATUS | VARCHAR2(15) | Yes |  |  |
| 22 | STATUS_REASON | VARCHAR2(100) | Yes |  |  |
| 23 | CLIENT_MSG_SENT | VARCHAR2(1) | Yes |  |  |
| 24 | CLIENT_MSG | VARCHAR2(100) | Yes |  |  |
| 25 | CLIENT_ID | VARCHAR2(10) | Yes |  |  |
| 26 | REP_JOB_ID | VARCHAR2(15) | Yes |  |  |
| 27 | REP_SERVER | VARCHAR2(80) | Yes |  |  |
| 28 | OUTPUT_FILE | VARCHAR2(200) | Yes |  |  |
| 29 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/RPT_PARM_BI|RPT_PARM_BI]] — BEFORE EACH ROW INSERT (ENABLED)

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
