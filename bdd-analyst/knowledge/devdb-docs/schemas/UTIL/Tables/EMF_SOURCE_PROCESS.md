---
tags:
  - table
  - UTIL
---
# EMF_SOURCE_PROCESS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 392
**Last Analyzed**: 2026-04-30 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCESS_CODE | VARCHAR2(10) | No |  |  |
| 2 | PROCESS_AT | VARCHAR2(10) | Yes |  |  |
| 3 | PROCESS_SEQ | NUMBER | No |  |  |
| 4 | LOOKING_FOR | VARCHAR2(100) | Yes |  |  |
| 5 | DATA_TABLE_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | DATA_COLUMN_NAME | VARCHAR2(30) | Yes |  |  |
| 7 | SQL_OPER | VARCHAR2(30) | Yes |  |  |
| 8 | RESPONSE | VARCHAR2(500) | Yes |  |  |
| 9 | SQL_STMT | VARCHAR2(2000) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | PARAM_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | SQL_OUT | VARCHAR2(100) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/EMF_SOURCE_PROCESS_BD|EMF_SOURCE_PROCESS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/EMF_SOURCE_PROCESS_BI|EMF_SOURCE_PROCESS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/EMF_SOURCE_PROCESS_BU|EMF_SOURCE_PROCESS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| EMF_UTIL | PACKAGE | UTIL |
