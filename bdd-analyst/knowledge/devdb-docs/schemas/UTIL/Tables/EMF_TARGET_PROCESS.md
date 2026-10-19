---
tags:
  - table
  - UTIL
---
# EMF_TARGET_PROCESS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 157
**Last Analyzed**: 2026-04-30 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCESS_CODE | VARCHAR2(10) | No |  |  |
| 2 | PROCESS_AT | VARCHAR2(10) | Yes |  |  |
| 3 | ACTION_SEQ | VARCHAR2(5) | No |  |  |
| 4 | ACTION_CODE | VARCHAR2(30) | No |  |  |
| 5 | ACTION_ON | VARCHAR2(30) | Yes |  |  |
| 6 | ACTION_VALUE | VARCHAR2(100) | Yes |  |  |
| 7 | DATA_TABLE_NAME | VARCHAR2(30) | Yes |  |  |
| 8 | DATA_COLUMN_NAME | VARCHAR2(30) | Yes |  |  |
| 9 | SQL_OPER | VARCHAR2(30) | Yes |  |  |
| 10 | RESPONSE | VARCHAR2(500) | Yes |  |  |
| 11 | PROCESS_ORDER | VARCHAR2(100) | Yes |  |  |
| 12 | ACTION_FNCS | VARCHAR2(500) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PARENT_ACTION_SEQ | VARCHAR2(5) | Yes |  |  |
| 18 | ALT_PROCESS_ORDER | VARCHAR2(100) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/EMF_TARGET_PROCESS_BD|EMF_TARGET_PROCESS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/EMF_TARGET_PROCESS_BI|EMF_TARGET_PROCESS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/EMF_TARGET_PROCESS_BU|EMF_TARGET_PROCESS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
