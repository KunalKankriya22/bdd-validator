---
tags:
  - table
  - SRVSYS
---
# SHELVES_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 72
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 5 | RACK_NUMBER | VARCHAR2(2) | Yes |  |  |
| 6 | SHELF_NUMBER | VARCHAR2(2) | Yes |  |  |
| 7 | SHELF_DESCRIPTION | VARCHAR2(30) | Yes |  |  |
| 8 | SHELF_TRAY_COUNT | NUMBER(2) | Yes |  |  |
| 9 | EFFECTIVE_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SHELVES_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
