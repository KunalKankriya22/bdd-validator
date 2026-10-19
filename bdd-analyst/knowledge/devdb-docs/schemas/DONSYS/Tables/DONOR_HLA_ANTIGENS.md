---
tags:
  - table
  - DONSYS
---
# DONOR_HLA_ANTIGENS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 997
**Last Analyzed**: 2025-09-16 03:11:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | A1 | VARCHAR2(6) | Yes |  |  |
| 4 | A2 | VARCHAR2(6) | Yes |  |  |
| 5 | B1 | VARCHAR2(6) | Yes |  |  |
| 6 | B2 | VARCHAR2(6) | Yes |  |  |
| 7 | C1 | VARCHAR2(6) | Yes |  |  |
| 8 | C2 | VARCHAR2(6) | Yes |  |  |
| 9 | D1 | VARCHAR2(6) | Yes |  |  |
| 10 | D2 | VARCHAR2(6) | Yes |  |  |
| 11 | DR | VARCHAR2(6) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**DONOR_HLA_ANTIGENS_PK**: `DONOR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_HLA_ANTIGENS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_HLA_ANTIGENS_BI|DONOR_HLA_ANTIGENS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
