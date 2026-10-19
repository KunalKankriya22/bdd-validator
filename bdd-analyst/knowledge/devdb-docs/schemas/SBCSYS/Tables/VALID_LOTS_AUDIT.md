---
tags:
  - table
  - SBCSYS
---
# VALID_LOTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7923
**Last Analyzed**: 2025-09-16 03:16:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | BAG_CODE | VARCHAR2(4) | Yes |  |  |
| 4 | VENDOR_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | DATE_RECEIVED | DATE | Yes |  |  |
| 6 | NUMBER_OF_UNITS | NUMBER(4) | Yes |  |  |
| 7 | NUMBER_OF_CARTONS | NUMBER(4) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 16 | EXPIRY_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_LOTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
