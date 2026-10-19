---
tags:
  - table
  - SRVSYS
---
# TRAYS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5730
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRAY_NUMBER | VARCHAR2(4) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 6 | RACK_NUMBER | VARCHAR2(2) | Yes |  |  |
| 7 | SHELF_NUMBER | VARCHAR2(2) | Yes |  |  |
| 8 | TRAY_DESCRIPTION | VARCHAR2(30) | Yes |  |  |
| 9 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | ITEM_COUNT | NUMBER | Yes |  |  |
| 11 | TRAY_STATUS | VARCHAR2(2) | Yes |  |  |
| 12 | EFFECTIVE_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 19 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TRAYS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
