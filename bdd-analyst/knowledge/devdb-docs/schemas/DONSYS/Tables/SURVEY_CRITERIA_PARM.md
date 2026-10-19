---
tags:
  - table
  - DONSYS
---
# SURVEY_CRITERIA_PARM

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 33
**Last Analyzed**: 2026-04-14 03:00:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INSERT_DATE | DATE | No |  |  |
| 2 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | SURVEY_GROUP_ID | VARCHAR2(5) | No |  |  |
| 8 | SURVEY_CATEGORY_CODE | VARCHAR2(5) | No |  |  |
| 9 | SURVEY_CATEGORY_VALUES | VARCHAR2(240) | Yes |  |  |
| 10 | LINKED_TEMPLATE_ID | VARCHAR2(240) | Yes |  |  |
| 11 | CHAPTER_ID | VARCHAR2(4) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/SURVEY_CRITERIA_PARM_BI|SURVEY_CRITERIA_PARM_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
