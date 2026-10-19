---
tags:
  - table
  - DONSYS
---
# GRADED_DONORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 638
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | DGM_ID | NUMBER(4) | No |  |  |
| 5 | POTENTIAL_DUPLICATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**GRADED_DONORS_PK**: `TRANSACTION_ID, CHAPTER_ID, DONOR_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GRADED_DONORS_PK | NORMAL | UNIQUE | TRANSACTION_ID, CHAPTER_ID, DONOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/GRADED_DONORS_BI|GRADED_DONORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
