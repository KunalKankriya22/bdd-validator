---
tags:
  - table
  - UTIL
---
# RPT_MASTER_CODES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 231
**Last Analyzed**: 2026-04-16 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | CODE_TYPE | VARCHAR2(6) | No |  |  |
| 3 | CODE | VARCHAR2(40) | No |  |  |
| 4 | CODE_DESC | VARCHAR2(30) | No |  |  |
| 5 | CODE_INFO | VARCHAR2(50) | Yes |  |  |
| 6 | LOCATION_ID | VARCHAR2(1) | Yes |  |  |
| 7 | SEQ | NUMBER(3) | Yes |  |  |
| 8 | SECOND_DEFINITION | VARCHAR2(15) | Yes |  |  |
| 9 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 10 | CLIENT_HOST | VARCHAR2(100) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RPT_MASTER_CODES_LAB_PK | NORMAL | UNIQUE | APPL_ID, CODE_TYPE, CODE, CHAPTER_ID | VALID |

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
| SRW_CALL_REPORT_LAB | PACKAGE | UTIL |
| SRW_CALL_REPORT_RSM | PACKAGE | UTIL |
