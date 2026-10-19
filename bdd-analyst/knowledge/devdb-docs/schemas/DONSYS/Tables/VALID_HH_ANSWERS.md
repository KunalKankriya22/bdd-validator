---
tags:
  - table
  - DONSYS
---
# VALID_HH_ANSWERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5226
**Last Analyzed**: 2025-09-16 03:14:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ANSWER_CODE | VARCHAR2(5) | No |  |  |
| 4 | RESPONSE | VARCHAR2(1) | No |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 7 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 8 | MINIMUM_PERIOD | NUMBER(4) | Yes |  |  |
| 9 | ANSWER_DESC | VARCHAR2(1000) | Yes |  |  |
| 10 | EFF_DATE | DATE | No |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |
| 16 | COMMENT_REQ | VARCHAR2(1) | Yes |  |  |
| 17 | MANUAL_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | GROUP_CODE | VARCHAR2(30) | Yes |  |  |
| 19 | ADDITIONAL_DATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | VARIABLE_DATE | VARCHAR2(1) | Yes |  |  |
| 21 | DATE_PERIOD_TYPE | VARCHAR2(10) | Yes |  |  |
| 22 | DATE_PERIOD_NUMBER | NUMBER | Yes |  |  |

## Primary Key

**VALID_HH_ANSWERS_PK**: `QUESTION_CODE, CHAPTER_ID, ANSWER_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| QUESTION_VALID_HH_ANSWERS_FK | QUESTION_CODE, CHAPTER_ID | [[schemas/DONSYS/Tables/VALID_HH_QUESTIONS\|DONSYS.VALID_HH_QUESTIONS]] (QUESTION_CODE, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HH_ANSWERS_PK | NORMAL | UNIQUE | QUESTION_CODE, CHAPTER_ID, ANSWER_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HH_ANSWERS_BD|VALID_HH_ANSWERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_ANSWERS_BI|VALID_HH_ANSWERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_ANSWERS_BU|VALID_HH_ANSWERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
