---
tags:
  - table
  - UTIL
---
# RPT_REPORT_NAMES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 584
**Last Analyzed**: 2025-09-16 03:16:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | REPORT_NAME | VARCHAR2(8) | No |  |  |
| 3 | REPORT_TYPE | VARCHAR2(3) | No |  |  |
| 4 | TITLE | VARCHAR2(40) | No |  |  |
| 5 | SUBTITLE | VARCHAR2(40) | Yes |  |  |
| 6 | PRINT_ID | VARCHAR2(40) | Yes |  |  |
| 7 | FORMS_TYPE | VARCHAR2(15) | Yes |  |  |
| 8 | BATCH_QUEUE | VARCHAR2(25) | Yes |  |  |
| 9 | LOAD | NUMBER | Yes |  |  |
| 10 | MAX_DURATION_SECS | NUMBER | Yes |  |  |
| 11 | PRIORITY | NUMBER(2) | Yes |  |  |
| 12 | PROGRAM_AUTHOR | VARCHAR2(10) | Yes |  |  |

## Primary Key

**RPT_REPORT_PK**: `APPL_ID, REPORT_NAME`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RPT_REPORT_PK | NORMAL | UNIQUE | APPL_ID, REPORT_NAME | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
