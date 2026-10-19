---
tags:
  - table
  - DONSYS
---
# DONOR_TYPE_HDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11
**Last Analyzed**: 2025-09-16 03:13:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | USER_ID | VARCHAR2(6) | No |  |  |
| 4 | PRINT_START_DATE | DATE | Yes |  |  |
| 5 | PRINT_END_DATE | DATE | Yes |  |  |
| 6 | SUBMIT_DATE | DATE | Yes |  |  |
| 7 | RUN_END_DATE | DATE | Yes |  |  |
| 8 | LETTER_COUNT | NUMBER | Yes |  |  |
| 9 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**DONOR_TYPE_HDR_PK**: `BATCH_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_TYPE_HDR_PK | NORMAL | UNIQUE | BATCH_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_TYPE_HDR_BI|DONOR_TYPE_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
