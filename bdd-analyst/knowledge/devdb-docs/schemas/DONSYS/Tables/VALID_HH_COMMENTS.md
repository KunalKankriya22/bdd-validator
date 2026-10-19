---
tags:
  - table
  - DONSYS
---
# VALID_HH_COMMENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 67
**Last Analyzed**: 2026-05-06 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 3 | ANSWER_CODE | VARCHAR2(10) | No |  |  |
| 4 | RESPONSE_CODE | VARCHAR2(3) | No |  |  |
| 5 | COMMENT_CODE | VARCHAR2(5) | No |  |  |
| 6 | COMMENT_DET | VARCHAR2(240) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | EFF_DATE | DATE | No |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HH_COMMENTS_BI|VALID_HH_COMMENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
