---
tags:
  - table
  - DONSYS
---
# DONOR_GRADING_MATRIX_9

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 432
**Last Analyzed**: 2025-09-16 03:11:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DGM_ID | NUMBER(4) | No |  |  |
| 2 | SSN_MATCH | VARCHAR2(5) | No |  |  |
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

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
