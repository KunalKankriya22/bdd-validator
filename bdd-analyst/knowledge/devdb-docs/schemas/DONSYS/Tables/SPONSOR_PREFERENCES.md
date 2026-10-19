---
tags:
  - table
  - DONSYS
---
# SPONSOR_PREFERENCES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 218
**Last Analyzed**: 2026-04-04 11:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PREFERENCE_CODE | VARCHAR2(5) | No |  |  |
| 4 | LOWER_LIMIT | VARCHAR2(20) | Yes |  |  |
| 5 | UPPER_LIMIT | VARCHAR2(20) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**SPONSOR_PREFERENCES_PK**: `SPONSOR_ID, CHAPTER_ID, PREFERENCE_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SPONSOR_PREFERENCES_PK | NORMAL | UNIQUE | SPONSOR_ID, CHAPTER_ID, PREFERENCE_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/SPONSOR_PREFERENCES_BI|SPONSOR_PREFERENCES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
