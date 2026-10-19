---
tags:
  - table
  - DONSYS
---
# HLA_RBC_MATCH_LISTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13533
**Last Analyzed**: 2026-05-16 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | REQUEST_ID | VARCHAR2(10) | No |  |  |
| 4 | GRADE_ID | NUMBER(5) | Yes |  |  |
| 5 | GRADE | VARCHAR2(5) | Yes |  |  |
| 6 | GRADE_LEVEL | NUMBER(5) | Yes |  |  |
| 7 | RBC_MATCH_COUNT | NUMBER(5) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

**HLA_RBC_MATCH_LISTS_PK**: `DONOR_ID, CHAPTER_ID, REQUEST_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| REQS_HLA_RBC_MATCH_LISTS_FK | REQUEST_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/HLA_RBC_REQUEST\|DONSYS.HLA_RBC_REQUEST]] (REQUEST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLA_RBC_MATCH_LISTS_IDX2 | NORMAL | NONUNIQUE | REQUEST_ID | VALID |
| HLA_RBC_MATCH_LISTS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, REQUEST_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/HLA_RBC_MATCH_LISTS_BI|HLA_RBC_MATCH_LISTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
