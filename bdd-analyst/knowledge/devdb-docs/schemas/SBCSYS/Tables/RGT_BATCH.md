---
tags:
  - table
  - SBCSYS
---
# RGT_BATCH

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | CBC_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 5 | UPLOAD_DATE | DATE | No |  |  |
| 6 | UNITS_COUNT | NUMBER(6) | Yes |  |  |
| 7 | FILE_NAME | VARCHAR2(30) | Yes |  |  |
| 8 | BATCH_STATUS | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CONTRACT_RGT_BATCH_FK | CONTRACT_ID, CHAPTER_ID | [[schemas/SBCSYS/Tables/CONTRACTS\|SBCSYS.CONTRACTS]] (CONTRACT_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
