---
tags:
  - table
  - SBCSYS
---
# INVENTORY_SNAPSHOT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SUMMARY_TYPE | VARCHAR2(10) | Yes |  |  |
| 2 | EVENT_DATE | DATE | Yes |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | ITEM_COUNT | NUMBER(6) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | IMPORT_COUNT | NUMBER(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INVENTORY_SNAPSHOT_IDX | NORMAL | NONUNIQUE | EVENT_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
