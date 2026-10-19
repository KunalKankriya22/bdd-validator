---
tags:
  - table
  - SRVSYS
---
# RETURN_ITEMS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 242
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RETURN_ADVICE_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | EXP_DATE | DATE | Yes |  |  |
| 9 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 10 | MOVE_DATE | DATE | Yes |  |  |
| 11 | RETURN_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 12 | CR_DB_IND | VARCHAR2(2) | Yes |  |  |
| 13 | LOCATION_ID | VARCHAR2(12) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 16 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RETURN_ITEMS_IDX_1 | NORMAL | UNIQUE | RETURN_ADVICE_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/RETURN_ITEMS_BEFORE_INSERT|RETURN_ITEMS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
