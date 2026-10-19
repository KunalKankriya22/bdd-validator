---
tags:
  - table
  - DONSYS
---
# VALID_HH_QUESTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 157
**Last Analyzed**: 2026-05-21 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | GENDER | VARCHAR2(1) | Yes |  |  |
| 4 | QUESTION_DESCRIPTION | VARCHAR2(1000) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | REF_CODE | VARCHAR2(10) | Yes |  |  |
| 12 | READ_MORE_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | MANUAL_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | MANUAL_AUDIT_HIST_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | VARIABLE_DATE | VARCHAR2(1) | Yes |  |  |
| 16 | DATE_PERIOD_TYPE | VARCHAR2(10) | Yes |  |  |
| 17 | DATE_PERIOD_NUMBER | NUMBER | Yes |  |  |

## Primary Key

**VALID_HH_QUESTIONS_PK**: `QUESTION_CODE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/VALID_HH_ANSWERS\|DONSYS.VALID_HH_ANSWERS]] | QUESTION_VALID_HH_ANSWERS_FK | QUESTION_CODE, CHAPTER_ID → QUESTION_CODE, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HH_QUESTIONS_PK | NORMAL | UNIQUE | QUESTION_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HH_QUESTIONS_BD|VALID_HH_QUESTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_QUESTIONS_BI|VALID_HH_QUESTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_QUESTIONS_BU|VALID_HH_QUESTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| DON_NURSING_AUDIT | PACKAGE | DONSYS |
