---
tags:
  - table
  - DONSYS
---
# VALID_HLA_GRADING

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 313
**Last Analyzed**: 2026-05-10 11:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | GRADE_ID | NUMBER(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | GRADE | VARCHAR2(5) | No |  |  |
| 4 | GRADE_LEVEL | NUMBER(5) | Yes |  |  |
| 5 | A1 | VARCHAR2(6) | Yes |  |  |
| 6 | A2 | VARCHAR2(6) | Yes |  |  |
| 7 | B1 | VARCHAR2(6) | Yes |  |  |
| 8 | B2 | VARCHAR2(6) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_HLA_GRADING_PK**: `GRADE_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HLA_GRADING_PK | NORMAL | UNIQUE | GRADE_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HLA_GRADING_BD|VALID_HLA_GRADING_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_GRADING_BI|VALID_HLA_GRADING_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_GRADING_BU|VALID_HLA_GRADING_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
