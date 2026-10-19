---
tags:
  - table
  - SRVSYS
---
# PRODUCT_STORAGE

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 262
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | No |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | No |  |  |
| 5 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 6 | TRAY_CAPACITY | VARCHAR2(2) | No |  |  |
| 7 | EFFECTIVE_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_STORAGE_IDX_1 | NORMAL | UNIQUE | WAREHOUSE_ID, CHAPTER_ID, DEVICE_TYPE, DEVICE_NUMBER, PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/PRODUCT_STORAGE_BD|PRODUCT_STORAGE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/PRODUCT_STORAGE_BI|PRODUCT_STORAGE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/PRODUCT_STORAGE_BU|PRODUCT_STORAGE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
