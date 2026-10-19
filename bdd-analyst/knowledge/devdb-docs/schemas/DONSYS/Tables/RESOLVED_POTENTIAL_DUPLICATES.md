---
tags:
  - table
  - DONSYS
---
# RESOLVED_POTENTIAL_DUPLICATES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 505
**Last Analyzed**: 2025-11-19 04:00:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | FIRST_DONOR_ID | VARCHAR2(10) | No |  |  |
| 3 | SECOND_DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RES_POT_DUP_IDX1 | NORMAL | NONUNIQUE | FIRST_DONOR_ID | VALID |
| RES_POT_DUP_IDX2 | NORMAL | NONUNIQUE | SECOND_DONOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/RESOLVED_POTENTIAL_DUPS_BI|RESOLVED_POTENTIAL_DUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
