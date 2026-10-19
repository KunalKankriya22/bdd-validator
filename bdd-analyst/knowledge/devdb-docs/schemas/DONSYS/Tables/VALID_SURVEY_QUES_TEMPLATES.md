---
tags:
  - table
  - DONSYS
---
# VALID_SURVEY_QUES_TEMPLATES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 263
**Last Analyzed**: 2026-04-16 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEMPLATE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 4 | QUESTION_DESC | VARCHAR2(1000) | Yes |  |  |
| 5 | DISP_QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 6 | TYPE_OF_SURVEY | VARCHAR2(5) | No |  |  |
| 7 | GENDER | VARCHAR2(1) | Yes |  |  |
| 8 | DISPLAY_ORDER | NUMBER | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | BLOCK_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | SUB_QUESTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | PARENT_QUES_CODE | VARCHAR2(10) | Yes |  |  |
| 18 | RANDOMIZATION_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUES_TEMPLATES_BD|VALID_SURVEY_QUES_TEMPLATES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUES_TEMPLATES_BI|VALID_SURVEY_QUES_TEMPLATES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_QUES_TEMPLATES_BU|VALID_SURVEY_QUES_TEMPLATES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
