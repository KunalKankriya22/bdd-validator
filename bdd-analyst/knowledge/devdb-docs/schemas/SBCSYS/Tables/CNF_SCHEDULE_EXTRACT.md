---
tags:
  - table
  - SBCSYS
---
# CNF_SCHEDULE_EXTRACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXTRACT_ID | VARCHAR2(20) | No |  |  |
| 2 | EXTRACT_DATE_TIME | DATE | Yes |  |  |
| 3 | FILE_NAME | VARCHAR2(240) | Yes |  |  |
| 4 | STATUS | VARCHAR2(1) | Yes |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 6 | GEN_REPORT | VARCHAR2(1) | Yes |  |  |
| 7 | REPORT_ID | VARCHAR2(20) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/CNF_SCHEDULE_EXTRACT_BI|CNF_SCHEDULE_EXTRACT_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
