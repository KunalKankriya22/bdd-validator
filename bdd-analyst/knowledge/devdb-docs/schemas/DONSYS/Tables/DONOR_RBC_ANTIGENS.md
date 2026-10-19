---
tags:
  - table
  - DONSYS
---
# DONOR_RBC_ANTIGENS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22656
**Last Analyzed**: 2026-05-17 11:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_CODE | VARCHAR2(5) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**DONOR_RBC_ANTIGENS_PK**: `DONOR_ID, CHAPTER_ID, TEST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_RBC_ANTIGENS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, TEST_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_RBC_ANTIGENS_BI|DONOR_RBC_ANTIGENS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
