---
tags:
  - table
  - SBCSYS
---
# VALID_LOTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 574
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

> [!quote] Created from Entity VALID LOT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LOT_NUMBER | VARCHAR2(30) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | BAG_CODE | VARCHAR2(4) | No |  |  |
| 4 | VENDOR_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | DATE_RECEIVED | DATE | Yes |  |  |
| 6 | NUMBER_OF_UNITS | NUMBER(4) | Yes |  |  |
| 7 | NUMBER_OF_CARTONS | NUMBER(4) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 14 | EXPIRY_DATE | DATE | Yes |  |  |
| 15 | SP_FLAG | VARCHAR2(50) | Yes |  |  |
| 16 | VOLUME_TYPE_SET | VARCHAR2(5) | Yes |  |  |
| 17 | SUPPLY_CODE | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_LOTS_IDX_1 | NORMAL | UNIQUE | LOT_NUMBER, CHAPTER_ID, CATALOG_NUMBER, VOLUME_TYPE_SET | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_LOTS_BEFORE_DELETE|VALID_LOTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_LOTS_INSERT_UPDATE|VALID_LOTS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
