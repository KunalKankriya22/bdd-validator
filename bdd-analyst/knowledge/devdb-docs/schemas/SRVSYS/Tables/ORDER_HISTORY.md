---
tags:
  - table
  - SRVSYS
---
# ORDER_HISTORY

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11068
**Last Analyzed**: 2025-09-16 03:16:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ORDER_STATUS | VARCHAR2(2) | No |  |  |
| 4 | FROM_DATE | DATE | No |  |  |
| 5 | USER_ID | VARCHAR2(10) | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | PICK_SLIP_ID | VARCHAR2(13) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_HISTORY_IDX_1 | NORMAL | NONUNIQUE | CHAPTER_ID, ORDER_NO, ORDER_STATUS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
