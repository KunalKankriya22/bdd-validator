---
tags:
  - table
  - DONSYS
---
# MULTI_LANG_CONVERTER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 70
**Last Analyzed**: 2025-09-16 03:13:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QUESTION_CODE | VARCHAR2(10) | Yes |  |  |
| 2 | LANG_CODE | VARCHAR2(2) | Yes |  |  |
| 3 | QUESTION_DESC_BLOB | BLOB | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/MULTI_LANG_CONVERTER_BI|MULTI_LANG_CONVERTER_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| QUESTION_DESC_BLOB | SYS_LOB0000076587C00003$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
