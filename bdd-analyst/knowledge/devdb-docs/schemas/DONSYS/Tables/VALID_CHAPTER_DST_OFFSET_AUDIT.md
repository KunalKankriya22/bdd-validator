---
tags:
  - table
  - DONSYS
---
# VALID_CHAPTER_DST_OFFSET_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 168
**Last Analyzed**: 2026-05-10 19:04:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | START_TIME | DATE | Yes |  |  |
| 3 | END_TIME | DATE | Yes |  |  |
| 4 | TZ_BASE_DIFF | VARCHAR2(15) | Yes |  |  |
| 5 | OFF_SET | NUMBER | Yes |  |  |
| 6 | LAST_MODIFED_DATE | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | TZ_REGION | VARCHAR2(64) | Yes |  |  |
| 9 | INSERTED_BY | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_DATE | DATE | Yes |  |  |
| 11 | UPDATED_BY | VARCHAR2(30) | Yes |  |  |
| 12 | UPDATE_DATE | DATE | Yes |  |  |
| 13 | DML_TYPE | VARCHAR2(6) | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
