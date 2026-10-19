---
tags:
  - table
  - DONSYS
---
# HLA_RBC_MATCH_TEMP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:18
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

## Primary Key

**HLA_RBC_MATCH_TEMP_PK**: `DONOR_ID, CHAPTER_ID, REQUEST_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DONOR_HLA_RBC_MATCH_TEMP_FK | CHAPTER_ID, DONOR_ID | [[schemas/DONSYS/Tables/DONORS\|DONSYS.DONORS]] (CHAPTER_ID, DONOR_ID) | NO ACTION |
| REQS_HLA_RBC_MATCH_TEMP_FK | REQUEST_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/HLA_RBC_REQUEST\|DONSYS.HLA_RBC_REQUEST]] (REQUEST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLA_RBC_MATCH_TEMP_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, REQUEST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
