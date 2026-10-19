---
tags:
  - table
  - SRVSYS
---
# SHELVES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | No |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | No |  |  |
| 5 | RACK_NUMBER | VARCHAR2(2) | No |  |  |
| 6 | SHELF_NUMBER | VARCHAR2(2) | Yes |  |  |
| 7 | SHELF_DESCRIPTION | VARCHAR2(30) | Yes |  |  |
| 8 | SHELF_TRAY_COUNT | NUMBER(2) | Yes |  |  |
| 9 | EFFECTIVE_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SHELVES_IDX_1 | NORMAL | UNIQUE | WAREHOUSE_ID, CHAPTER_ID, DEVICE_TYPE, DEVICE_NUMBER, RACK_NUMBER, SHELF_NUMBER | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/SHELVES_BD|SHELVES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/SHELVES_BI|SHELVES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/SHELVES_BU|SHELVES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
