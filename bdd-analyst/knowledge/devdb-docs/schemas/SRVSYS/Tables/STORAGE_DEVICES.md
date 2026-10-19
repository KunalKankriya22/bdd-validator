---
tags:
  - table
  - SRVSYS
---
# STORAGE_DEVICES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 95
**Last Analyzed**: 2026-05-23 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | No |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | No |  |  |
| 5 | DEVICE_STATUS | VARCHAR2(4) | No |  |  |
| 6 | DEVICE_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 7 | RACK_COUNT | NUMBER(4) | Yes |  |  |
| 8 | INSTALL_DATE | DATE | Yes |  |  |
| 9 | LAST_SERVICE_DATE | DATE | Yes |  |  |
| 10 | NEXT_SERVICE_DATE | DATE | Yes |  |  |
| 11 | LAST_TEMPARATURE | NUMBER(5,2) | Yes |  |  |
| 12 | TEMP_READ_DATE | DATE | Yes |  |  |
| 13 | EFFECTIVE_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STORAGE_DEVICES_IDX_1 | NORMAL | UNIQUE | WAREHOUSE_ID, CHAPTER_ID, DEVICE_TYPE, DEVICE_NUMBER | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/STORAGE_DEVICES_BD|STORAGE_DEVICES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/STORAGE_DEVICES_BI|STORAGE_DEVICES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/STORAGE_DEVICES_BU|STORAGE_DEVICES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
