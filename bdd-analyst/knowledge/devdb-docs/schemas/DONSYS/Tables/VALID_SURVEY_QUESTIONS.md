---
tags:
  - table
  - DONSYS
---
# VALID_SURVEY_QUESTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 76
**Last Analyzed**: 2026-04-14 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | TYPE_OF_SURVEY | VARCHAR2(5) | Yes |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 4 | QUESTION_DESC | VARCHAR2(1000) | No |  |  |
| 5 | GENDER | VARCHAR2(1) | No |  |  |
| 6 | RESPONSE_TYPE | VARCHAR2(1) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUESTIONS_BD|VALID_SURVEY_QUESTIONS_BD]] — BEFORE EACH ROW DELETE (DISABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUESTIONS_BI|VALID_SURVEY_QUESTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUESTIONS_BU|VALID_SURVEY_QUESTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
