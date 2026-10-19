---
tags:
  - table
  - DONSYS
---
# DONOR_LIST_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 441471
**Last Analyzed**: 2025-09-16 03:13:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LIST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LOG_TYPE | VARCHAR2(10) | No |  |  |
| 4 | LOG_DATE | DATE | No |  |  |
| 5 | LOG_TEXT | VARCHAR2(2000) | No |  |  |
| 6 | LOG_SEQ | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LIST_LOG_IDX1 | NORMAL | NONUNIQUE | LIST_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
