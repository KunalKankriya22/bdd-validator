---
tags:
  - table
  - DONSYS
---
# HEALTH_HISTORY_HOLDINGS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 199
**Last Analyzed**: 2025-09-24 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 4 | ANSWER_CODE | VARCHAR2(5) | No |  |  |
| 5 | RESPONSE | VARCHAR2(1) | No |  |  |
| 6 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 7 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 9 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 10 | INCIDENT_DATE | DATE | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | DEF_THRU_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | HOLDING_REASON | VARCHAR2(200) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DONAT_HEALTH_HIST_HOLD_FK | TRANSACTION_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DONATIONS\|DONSYS.DONATIONS]] (TRANSACTION_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
