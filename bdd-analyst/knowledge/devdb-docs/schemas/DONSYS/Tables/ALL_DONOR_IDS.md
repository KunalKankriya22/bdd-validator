---
tags:
  - table
  - DONSYS
---
# ALL_DONOR_IDS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 51
**Last Analyzed**: 2026-05-22 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ID_TYPE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LAST_SEQUENCE | NUMBER(8) | No |  |  |
| 4 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 5 | DESCRIPTION | VARCHAR2(50) | No |  |  |
| 6 | START_NUMBER | NUMBER(8) | No |  |  |
| 7 | RESET_CYCLE | VARCHAR2(2) | Yes |  |  |
| 8 | LAST_RESET_DATE | DATE | Yes |  |  |

## Primary Key

**ALL_DONOR_IDS_PK**: `ID_TYPE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ALL_DONOR_IDS_PK | NORMAL | UNIQUE | ID_TYPE, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
