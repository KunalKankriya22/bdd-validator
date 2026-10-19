---
tags:
  - table
  - UTIL
---
# RPT_PARM_CODE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 240
**Last Analyzed**: 2026-02-27 04:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 3 | PARM_PROMPT | VARCHAR2(40) | No |  |  |
| 4 | CODE_DESC | VARCHAR2(30) | No |  |  |
| 5 | CODE_TYPE | VARCHAR2(6) | No |  |  |
| 6 | LIST_ENTRY_FLAG | VARCHAR2(1) | No |  |  |
| 7 | UPPER_CASE_FLAG | VARCHAR2(1) | No |  |  |
| 8 | REF_TABLE | VARCHAR2(30) | Yes |  |  |
| 9 | REF_COLUMN | VARCHAR2(30) | Yes |  |  |
| 10 | DEFAULT_VALUE | VARCHAR2(15) | Yes |  |  |
| 11 | LIST_FORM_NAME | VARCHAR2(8) | Yes |  |  |
| 12 | REF_SQL | VARCHAR2(500) | Yes |  |  |
| 13 | LOV_TITLE | VARCHAR2(50) | Yes |  |  |
| 14 | LOV_COL1_NAME | VARCHAR2(20) | Yes |  |  |
| 15 | LOV_COL2_NAME | VARCHAR2(20) | Yes |  |  |
| 16 | LOV_LIMIT | VARCHAR2(1) | Yes |  |  |

## Primary Key

**RPT_PARM_CODE_PK**: `APPL_ID, PARM_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RPT_PARM_CODE_PK | NORMAL | UNIQUE | APPL_ID, PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
