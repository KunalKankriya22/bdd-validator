---
tags:
  - table
  - UTIL
---
# EMF_PROCESS_MAPPING

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 175
**Last Analyzed**: 2026-04-24 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MAPPING_NAME | VARCHAR2(100) | No |  |  |
| 2 | DATA_COLUMN_NAME | VARCHAR2(30) | Yes |  |  |
| 3 | DATA_TABLE_NAME | VARCHAR2(30) | Yes |  |  |
| 4 | WHERE_CLAUSE | VARCHAR2(2000) | Yes |  |  |
| 5 | SQL_STMT | VARCHAR2(2000) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROCESS_CODE | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/EMF_PROCESS_MAPPING_BD|EMF_PROCESS_MAPPING_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/EMF_PROCESS_MAPPING_BI|EMF_PROCESS_MAPPING_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/EMF_PROCESS_MAPPING_BU|EMF_PROCESS_MAPPING_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
