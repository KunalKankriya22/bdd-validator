---
tags:
  - table
  - SBCSYS
---
# ITEM_MASTER

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ITEM_CODE | VARCHAR2(4) | No |  |  |
| 2 | ITEM_DESC | VARCHAR2(30) | Yes |  |  |
| 3 | UNIT_MEASURE | VARCHAR2(10) | Yes |  |  |
| 4 | ITEM_RATE | NUMBER(8,2) | Yes |  |  |

## Primary Key

**SYS_C0010822**: `ITEM_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SYS_C0010822 | NORMAL | UNIQUE | ITEM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
