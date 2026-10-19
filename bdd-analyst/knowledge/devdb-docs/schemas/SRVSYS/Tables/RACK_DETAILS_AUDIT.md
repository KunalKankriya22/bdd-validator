---
tags:
  - table
  - SRVSYS
---
# RACK_DETAILS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3566
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 6 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | RACK_NUMBER | VARCHAR2(2) | Yes |  |  |
| 8 | RACK_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 9 | SHELF_COUNT | NUMBER(2) | Yes |  |  |
| 10 | TRAY_COUNT | NUMBER(4) | Yes |  |  |
| 11 | STORAGE_CLASS | VARCHAR2(2) | Yes |  |  |
| 12 | EFFECTIVE_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | AUDIT_KEY | NUMBER | No |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 19 | MIX_ABO | VARCHAR2(1) | Yes |  |  |
| 20 | MIX_PRODUCT | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RACK_DETAILS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
