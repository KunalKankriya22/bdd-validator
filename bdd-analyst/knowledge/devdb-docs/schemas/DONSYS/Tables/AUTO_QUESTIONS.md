---
tags:
  - table
  - DONSYS
---
# AUTO_QUESTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:10:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PAT_ID | VARCHAR2(10) | No |  |  |
| 2 | SURG_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | QUESTION_CODE | VARCHAR2(5) | No |  |  |
| 5 | ANSWER | VARCHAR2(5) | No |  |  |
| 6 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**AUTO_QUESTIONS_PK**: `PAT_ID, SURG_ID, CHAPTER_ID, QUESTION_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| AUTO_QUESTIONS_PK | NORMAL | UNIQUE | PAT_ID, SURG_ID, CHAPTER_ID, QUESTION_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/AUTO_QUESTIONS_BI|AUTO_QUESTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
