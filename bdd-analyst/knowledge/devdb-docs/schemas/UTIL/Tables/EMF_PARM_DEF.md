---
tags:
  - table
  - UTIL
---
# EMF_PARM_DEF

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 82
**Last Analyzed**: 2026-05-01 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROC_CODE | VARCHAR2(10) | No |  |  |
| 2 | PARM_NO | NUMBER(2) | No |  |  |
| 3 | PARM_CODE | VARCHAR2(50) | No |  |  |
| 4 | PARM_TYPE | VARCHAR2(10) | No |  |  |
| 5 | PARM_INOUT | VARCHAR2(5) | No |  |  |
| 6 | DEFAULT_VALUE | VARCHAR2(30) | Yes |  |  |
| 7 | REF_TABLE | VARCHAR2(30) | Yes |  |  |
| 8 | REF_COLUMN | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/EMF_PARM_DEF_BD|EMF_PARM_DEF_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/EMF_PARM_DEF_BI|EMF_PARM_DEF_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/EMF_PARM_DEF_BU|EMF_PARM_DEF_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
