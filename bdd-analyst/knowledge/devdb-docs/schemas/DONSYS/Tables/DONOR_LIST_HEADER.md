---
tags:
  - table
  - DONSYS
---
# DONOR_LIST_HEADER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1834
**Last Analyzed**: 2025-09-16 03:13:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LIST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LIST_TYPE | VARCHAR2(5) | No |  |  |
| 4 | LIST_PRIORITY | VARCHAR2(1) | No |  |  |
| 5 | LIST_STATUS | VARCHAR2(10) | No |  |  |
| 6 | LIST_GEN_TYPE | VARCHAR2(5) | No |  |  |
| 7 | LIST_ELIG_CHECK | VARCHAR2(1) | No |  |  |
| 8 | DONOR_OVERRIDE | VARCHAR2(1) | No |  |  |
| 9 | ENLISTMENT_TYPE | VARCHAR2(5) | No |  |  |
| 10 | LIST_NAME | VARCHAR2(50) | Yes |  |  |
| 11 | LIST_SEQ | NUMBER | Yes |  |  |
| 12 | LIST_SUBMIT_TIME | DATE | Yes |  |  |
| 13 | LIST_SCHEDULE_TIME | DATE | Yes |  |  |
| 14 | LIST_START_TIME | DATE | Yes |  |  |
| 15 | LIST_END_TIME | DATE | Yes |  |  |
| 16 | LIST_GEN_DATE | DATE | Yes |  |  |
| 17 | LIST_EFF_DATE | DATE | Yes |  |  |
| 18 | LIST_TERM_DATE | DATE | Yes |  |  |
| 19 | LIFE_EXTEND_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | LIFE_EXTEND_BY | VARCHAR2(6) | Yes |  |  |
| 21 | LIFE_EXTEND_ON | DATE | Yes |  |  |
| 22 | LIST_COMMENTS | VARCHAR2(240) | Yes |  |  |
| 23 | LIST_MAX_USERS | NUMBER(6) | Yes |  |  |
| 24 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 25 | INSERT_DATE | DATE | No |  |  |
| 26 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 27 | PRE_ELIG | NUMBER | Yes |  |  |
| 28 | PRE_RAND | NUMBER | Yes |  |  |
| 29 | SORT_COL1 | VARCHAR2(40) | Yes |  |  |
| 30 | SORT_COL2 | VARCHAR2(40) | Yes |  |  |
| 31 | RELEASE_DATE | DATE | Yes |  |  |
| 32 | RELEASE_USER | VARCHAR2(6) | Yes |  |  |
| 33 | ACTUAL_SIZE | NUMBER(6) | Yes |  |  |
| 34 | ASSIGNED_TO | VARCHAR2(6) | Yes |  |  |
| 35 | PARENT_LIST_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

**DONOR_LIST_HEADER_PK**: `LIST_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/DONOR_LISTS\|DONSYS.DONOR_LISTS]] | LIST_DONOR_LISTS_FK | LIST_ID, CHAPTER_ID → LIST_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LIST_HEADER_PK | NORMAL | UNIQUE | LIST_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_LIST_HEADER_BI|DONOR_LIST_HEADER_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
