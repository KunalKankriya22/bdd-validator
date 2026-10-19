---
tags:
  - table
  - DONSYS
---
# DONOR_GRADING_MATRIX_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1909
**Last Analyzed**: 2026-04-10 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | DGM_ID | NUMBER(4) | Yes |  |  |
| 6 | SSN_MATCH | VARCHAR2(5) | Yes |  |  |
| 7 | LASTNAME_MATCH | VARCHAR2(5) | Yes |  |  |
| 8 | FIRSTNAME_MATCH | VARCHAR2(5) | Yes |  |  |
| 9 | DOB_MATCH | VARCHAR2(5) | Yes |  |  |
| 10 | GENDER_MATCH | VARCHAR2(5) | Yes |  |  |
| 11 | GRADE | NUMBER(2) | Yes |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
