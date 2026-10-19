---
tags:
  - table
  - UTIL
---
# RPT_PARM_DEF

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1588
**Last Analyzed**: 2026-03-14 15:07:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | REPORT_NAME | VARCHAR2(8) | No |  |  |
| 3 | PARM_NO | NUMBER(2) | No |  |  |
| 4 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 5 | LIST_ENTRY_FLAG | VARCHAR2(1) | No |  |  |

## Primary Key

**RPT_PARM_DEF_PK**: `APPL_ID, REPORT_NAME, PARM_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RPT_PARM_DEF_PK | NORMAL | UNIQUE | APPL_ID, REPORT_NAME, PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
