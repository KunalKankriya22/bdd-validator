---
tags:
  - table
  - DONSYS
---
# DONOR_LISTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 449
**Last Analyzed**: 2025-11-23 00:04:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LIST_ID | VARCHAR2(10) | No |  |  |
| 4 | CALL_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | CALLED_USER | VARCHAR2(6) | Yes |  |  |
| 6 | CALL_DATE | DATE | Yes |  |  |
| 7 | SCHED_USER | VARCHAR2(6) | Yes |  |  |
| 8 | SCHED_DATE | DATE | Yes |  |  |
| 9 | LOCKED_BY | VARCHAR2(6) | Yes |  |  |
| 10 | CALL_AFTER | DATE | Yes |  |  |
| 11 | CONTACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | LAST_BROWSE | DATE | Yes |  |  |
| 13 | CALL_FLAG1 | VARCHAR2(10) | Yes |  |  |
| 14 | CALL_FLAG2 | VARCHAR2(10) | Yes |  |  |

## Primary Key

**DONOR_LISTS_PK**: `DONOR_ID, CHAPTER_ID, LIST_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| LIST_DONOR_LISTS_FK | LIST_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DONOR_LIST_HEADER\|DONSYS.DONOR_LIST_HEADER]] (LIST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LISTS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, LIST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
