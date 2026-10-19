---
tags:
  - table
  - DONSYS
---
# VALID_SURVEY_ANSWERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 561
**Last Analyzed**: 2026-04-15 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 3 | ANSWER_CODE | VARCHAR2(10) | No |  |  |
| 4 | ANSWER_DESC | VARCHAR2(500) | No |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | DISPLAY_SEQ | NUMBER(3) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SURVEY_ANSWERS_BD|VALID_SURVEY_ANSWERS_BD]] — BEFORE EACH ROW DELETE (DISABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_ANSWERS_BI|VALID_SURVEY_ANSWERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_ANSWERS_BU|VALID_SURVEY_ANSWERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
