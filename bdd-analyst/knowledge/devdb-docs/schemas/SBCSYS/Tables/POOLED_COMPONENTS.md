---
tags:
  - table
  - SBCSYS
---
# POOLED_COMPONENTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 856
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

> [!quote] Created from Entity POOLED COMPONENTS by WADLEY on 04-MAY-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | POOL_ID | VARCHAR2(15) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PATIENT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | PATIENT_FIRST_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | PATIENT_LAST_NAME | VARCHAR2(50) | Yes |  |  |
| 6 | FACILITY | VARCHAR2(50) | Yes |  |  |
| 7 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 8 | BAG_ID | VARCHAR2(4) | No |  |  |
| 9 | LOT_NUMBER | VARCHAR2(30) | No |  |  |
| 10 | FILTER_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 11 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 12 | POOL_DATS | DATE | No |  |  |
| 13 | POOL_EXPIRY_DATS | DATE | No |  |  |
| 14 | POOL_INSERT_DATS | DATE | No |  |  |
| 15 | POOL_USER_ID | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | POOLED_ABORH | VARCHAR2(5) | Yes |  |  |
| 19 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 20 | POOL_WEIGHT | NUMBER(6,2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| POOLED_COMPONENTS_IDX_1 | NORMAL | UNIQUE | POOL_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/POOLED_COMP_BEFORE_DELETE|POOLED_COMP_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/POOLED_COMP_BEFORE_INSERT|POOLED_COMP_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/POOLED_COMP_BEFORE_UPDATE|POOLED_COMP_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
