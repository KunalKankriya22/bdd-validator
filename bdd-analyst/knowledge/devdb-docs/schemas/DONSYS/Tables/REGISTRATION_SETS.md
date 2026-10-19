---
tags:
  - table
  - DONSYS
---
# REGISTRATION_SETS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24030
**Last Analyzed**: 2025-09-16 03:14:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SET_ID | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | START_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | END_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | START_DATA_ENTRY_TIME | DATE | Yes |  |  |
| 6 | END_DATA_ENTRY_TIME | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**REGISTRATION_SETS_PK**: `SET_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| REGISTRATION_SETS_N1 | NORMAL | NONUNIQUE | INSERT_DATE | VALID |
| REGISTRATION_SETS_PK | NORMAL | UNIQUE | SET_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/REGISTRATION_SETS_BI|REGISTRATION_SETS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
