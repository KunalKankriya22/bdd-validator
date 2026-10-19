---
tags:
  - table
  - DONSYS
---
# PATIENT_HLA_ANTIGENS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 441
**Last Analyzed**: 2025-09-16 03:14:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PATIENT_ID | VARCHAR2(10) | No |  |  |
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
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**PATIENT_HLA_ANTIGENS_PK**: `PATIENT_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PATIENT_HLA_ANTIGENS_PK | NORMAL | UNIQUE | PATIENT_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PATIENT_HLA_ANTIGENS_BD|PATIENT_HLA_ANTIGENS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/PATIENT_HLA_ANTIGENS_BI|PATIENT_HLA_ANTIGENS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/PATIENT_HLA_ANTIGENS_BU|PATIENT_HLA_ANTIGENS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
