---
tags:
  - table
  - DONSYS
---
# VALID_HLA_GRADING_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2989
**Last Analyzed**: 2025-09-16 03:14:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | GRADE_ID | NUMBER(5) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | GRADE | VARCHAR2(5) | Yes |  |  |
| 8 | GRADE_LEVEL | NUMBER(5) | Yes |  |  |
| 9 | A1 | VARCHAR2(6) | Yes |  |  |
| 10 | A2 | VARCHAR2(6) | Yes |  |  |
| 11 | B1 | VARCHAR2(6) | Yes |  |  |
| 12 | B2 | VARCHAR2(6) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |

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
