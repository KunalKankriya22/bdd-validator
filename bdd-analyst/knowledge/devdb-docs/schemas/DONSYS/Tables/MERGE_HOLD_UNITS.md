---
tags:
  - table
  - DONSYS
---
# MERGE_HOLD_UNITS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 59
**Last Analyzed**: 2025-09-16 03:13:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | STATUS | VARCHAR2(5) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**MERGE_HOLD_UNITS_PK**: `DONOR_ID, CHAPTER_ID, UNIT_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MERGE_HOLD_UNITS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, UNIT_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/MERGE_HOLD_UNITS_BI|MERGE_HOLD_UNITS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
