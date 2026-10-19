---
tags:
  - table
  - SBCSYS
---
# POOLED_COMPONENTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1729
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 3 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 4 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | POOL_ID | VARCHAR2(15) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | PATIENT_ID | VARCHAR2(15) | Yes |  |  |
| 8 | PATIENT_FIRST_NAME | VARCHAR2(50) | Yes |  |  |
| 9 | PATIENT_LAST_NAME | VARCHAR2(50) | Yes |  |  |
| 10 | FACILITY | VARCHAR2(50) | Yes |  |  |
| 11 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 12 | BAG_ID | VARCHAR2(4) | Yes |  |  |
| 13 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 14 | FILTER_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 15 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 16 | POOL_DATS | DATE | Yes |  |  |
| 17 | POOL_EXPIRY_DATS | DATE | Yes |  |  |
| 18 | POOL_INSERT_DATS | DATE | Yes |  |  |
| 19 | POOL_USER_ID | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| POOLED_COMP_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
