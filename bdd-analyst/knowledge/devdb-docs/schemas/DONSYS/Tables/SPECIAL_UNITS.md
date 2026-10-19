---
tags:
  - table
  - DONSYS
---
# SPECIAL_UNITS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1598
**Last Analyzed**: 2025-09-16 03:14:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PAT_ID | VARCHAR2(10) | No |  |  |
| 2 | SURG_ID | VARCHAR2(10) | No |  |  |
| 3 | SEQ_NO | NUMBER(3) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 6 | COLL_DATE | DATE | No |  |  |
| 7 | CONSIGNEE_ID | VARCHAR2(10) | Yes |  |  |
| 8 | SHIP_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SPECIAL_UNITS_IDX1 | NORMAL | NONUNIQUE | PAT_ID | VALID |
| SPECIAL_UNITS_IDX2 | NORMAL | NONUNIQUE | UNIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
