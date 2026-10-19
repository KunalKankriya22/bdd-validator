---
tags:
  - table
  - DONSYS
---
# HEALTH_HISTORY_TEMPLATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2724
**Last Analyzed**: 2026-04-30 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEMPLATE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 4 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 5 | GENDER | VARCHAR2(1) | Yes |  |  |
| 6 | QUESTION_DESCRIPTION | VARCHAR2(1000) | Yes |  |  |
| 7 | VALID_CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | SORT_SEQUENCE | VARCHAR2(5) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | SCREENER_ASK | VARCHAR2(1) | Yes |  |  |
| 16 | SUB_QUESTION_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | PARENT_QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 18 | DISPLAY_ORDER | NUMBER | Yes |  |  |
| 19 | REPEAT_HH_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | RANDOMIZATION_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | ABBR_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | PARENT_RESP_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | GOTO_NOTES | VARCHAR2(100) | Yes |  |  |
| 24 | ABBR_DISP_SEQ | NUMBER | Yes |  |  |

## Primary Key

**HEALTH_HISTORY_TEMPLATE_PK**: `TEMPLATE_ID, CHAPTER_ID, QUESTION_CODE, DONATION_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HEALTH_HISTORY_TEMPLATE_IDX2 | NORMAL | NONUNIQUE | SORT_SEQUENCE, TEMPLATE_ID | VALID |
| HEALTH_HISTORY_TEMPLATE_PK | NORMAL | UNIQUE | TEMPLATE_ID, CHAPTER_ID, QUESTION_CODE, DONATION_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_TEMPLATE_BD|HEALTH_HISTORY_TEMPLATE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_TEMPLATE_BI|HEALTH_HISTORY_TEMPLATE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/HEALTH_HISTORY_TEMPLATE_BU|HEALTH_HISTORY_TEMPLATE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
