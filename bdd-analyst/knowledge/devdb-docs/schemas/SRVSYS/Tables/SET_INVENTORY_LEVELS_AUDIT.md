---
tags:
  - table
  - SRVSYS
---
# SET_INVENTORY_LEVELS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1206
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 2 | INVENTORY_TYPE | VARCHAR2(2) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 6 | QTY | NUMBER(5) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 10 | TIER | NUMBER(2) | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 13 | ATTRIB_GROUP | VARCHAR2(10) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SET_INVENTORY_LEVELS_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
