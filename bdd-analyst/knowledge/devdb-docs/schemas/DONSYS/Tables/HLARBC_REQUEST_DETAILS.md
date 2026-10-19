---
tags:
  - table
  - DONSYS
---
# HLARBC_REQUEST_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7
**Last Analyzed**: 2025-09-16 03:13:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REQUEST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

**HLARBC_REQUEST_DETAILS_PK**: `REQUEST_ID, CHAPTER_ID, ATTRIB_GROUP`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| REQS_HLARBC_REQS_DET_FK | REQUEST_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/HLA_RBC_REQUEST\|DONSYS.HLA_RBC_REQUEST]] (REQUEST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HLARBC_REQUEST_DETAILS_PK | NORMAL | UNIQUE | REQUEST_ID, CHAPTER_ID, ATTRIB_GROUP | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/HLARBC_REQUEST_DETAILS_BI|HLARBC_REQUEST_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
