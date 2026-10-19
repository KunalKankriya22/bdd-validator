---
tags:
  - table
  - SRVSYS
---
# PRODUCT_STORAGE_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1700
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 5 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | TRAY_CAPACITY | VARCHAR2(2) | Yes |  |  |
| 7 | EFFECTIVE_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_STORAGE_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
