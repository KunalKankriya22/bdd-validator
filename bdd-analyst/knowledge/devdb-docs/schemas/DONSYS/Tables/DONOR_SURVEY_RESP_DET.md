---
tags:
  - table
  - DONSYS
---
# DONOR_SURVEY_RESP_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3327
**Last Analyzed**: 2026-04-10 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SURVEY_ID | VARCHAR2(30) | No |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 3 | ANSWER_CODE | VARCHAR2(10) | No |  |  |
| 4 | ANSWER_COMMENTS | VARCHAR2(500) | Yes |  |  |
| 5 | RESPONSE_TYPE | VARCHAR2(1) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | RANK_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 12 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_SURVEY_RESP_DET_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_DET_BD|DONOR_SURVEY_RESP_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_DET_BI|DONOR_SURVEY_RESP_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_SURVEY_RESP_DET_BU|DONOR_SURVEY_RESP_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
