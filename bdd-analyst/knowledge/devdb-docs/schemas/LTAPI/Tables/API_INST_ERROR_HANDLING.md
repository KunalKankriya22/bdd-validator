---
tags:
  - table
  - LTAPI
---
# API_INST_ERROR_HANDLING

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 40
**Last Analyzed**: 2026-05-08 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ERROR_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | ERROR_DESC | VARCHAR2(250) | Yes |  |  |
| 5 | SKIP_LEVEL | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | MACHINE_TEST_ID | VARCHAR2(50) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/LTAPI/Triggers/API_INST_ERROR_HANDLING_BD|API_INST_ERROR_HANDLING_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/LTAPI/Triggers/API_INST_ERROR_HANDLING_BI|API_INST_ERROR_HANDLING_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/LTAPI/Triggers/API_INST_ERROR_HANDLING_BU|API_INST_ERROR_HANDLING_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
