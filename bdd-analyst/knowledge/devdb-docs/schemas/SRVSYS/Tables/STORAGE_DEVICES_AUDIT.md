---
tags:
  - table
  - SRVSYS
---
# STORAGE_DEVICES_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 398
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 3 | DEVICE_TYPE | VARCHAR2(1) | Yes |  |  |
| 4 | DEVICE_NUMBER | VARCHAR2(2) | Yes |  |  |
| 5 | DEVICE_DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 6 | DEVICE_STATUS | VARCHAR2(4) | Yes |  |  |
| 7 | RACK_COUNT | NUMBER(4) | Yes |  |  |
| 8 | INSTALL_DATE | DATE | Yes |  |  |
| 9 | LAST_SERVICE_DATE | DATE | Yes |  |  |
| 10 | NEXT_SERVICE_DATE | DATE | Yes |  |  |
| 11 | LAST_TEMPARATURE | NUMBER(5,2) | Yes |  |  |
| 12 | TEMP_READ_DATE | DATE | Yes |  |  |
| 13 | EFFECTIVE_DATE | DATE | Yes |  |  |
| 14 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 19 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STORAGE_DEVICES_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
