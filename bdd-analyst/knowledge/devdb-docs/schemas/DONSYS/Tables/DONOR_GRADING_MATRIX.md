---
tags:
  - table
  - DONSYS
---
# DONOR_GRADING_MATRIX

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 301
**Last Analyzed**: 2026-05-19 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DGM_ID | NUMBER(4) | No |  |  |
| 2 | SSN_MATCH | VARCHAR2(5) | Yes |  |  |
| 3 | LASTNAME_MATCH | VARCHAR2(5) | No |  |  |
| 4 | FIRSTNAME_MATCH | VARCHAR2(5) | No |  |  |
| 5 | DOB_MATCH | VARCHAR2(5) | No |  |  |
| 6 | GENDER_MATCH | VARCHAR2(5) | No |  |  |
| 7 | GRADE | NUMBER(2) | No |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_GRADING_MATRIX_IDX1 | NORMAL | NONUNIQUE | DGM_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_GRADING_MATRIX_BD|DONOR_GRADING_MATRIX_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_GRADING_MATRIX_BI|DONOR_GRADING_MATRIX_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_GRADING_MATRIX_BU|DONOR_GRADING_MATRIX_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
