---
tags:
  - table
  - DONSYS
---
# HLA_RBC_MATCH_UNITS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 186
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | REQUEST_ID | VARCHAR2(10) | No |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | COLL_DATE | DATE | No |  |  |
| 6 | GRADE_ID | NUMBER(5) | Yes |  |  |
| 7 | GRADE | VARCHAR2(5) | Yes |  |  |
| 8 | GRADE_LEVEL | NUMBER(5) | Yes |  |  |
| 9 | ABO | VARCHAR2(5) | Yes |  |  |
| 10 | WAREHOUSE_CODE | VARCHAR2(12) | Yes |  |  |
| 11 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 12 | PRODUCT_TYPE | VARCHAR2(10) | Yes |  |  |
| 13 | CMV_STATUS | VARCHAR2(1) | Yes |  |  |
| 14 | ANTIGEN_STRING | VARCHAR2(500) | Yes |  |  |
| 15 | RBC_MATCH_COUNT | NUMBER(5) | Yes |  |  |
| 16 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 17 | INSERT_DATE | DATE | No |  |  |
| 18 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DONOR_HLA_RBC_MATCH_UNITS_FK | CHAPTER_ID, DONOR_ID | [[schemas/DONSYS/Tables/DONORS\|DONSYS.DONORS]] (CHAPTER_ID, DONOR_ID) | NO ACTION |
| REQS_HLA_RBC_MATCH_UNITS_FK | REQUEST_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/HLA_RBC_REQUEST\|DONSYS.HLA_RBC_REQUEST]] (REQUEST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLA_RBC_MATCH_UNITS_IDX1 | NORMAL | NONUNIQUE | REQUEST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
