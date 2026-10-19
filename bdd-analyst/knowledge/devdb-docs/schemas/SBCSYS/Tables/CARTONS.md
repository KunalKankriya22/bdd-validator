---
tags:
  - table
  - SBCSYS
---
# CARTONS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4669
**Last Analyzed**: 2025-09-16 03:14:20
**Partitioned**: NO

> [!quote] Created from Entity CARTON by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AIRWAY_BILL_NO | VARCHAR2(14) | No |  |  |
| 2 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | CARTON_NUMBER | VARCHAR2(5) | Yes |  |  |
| 5 | RECEIVED_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CARTONS_IDX2 | NORMAL | NONUNIQUE | BATCH_ID | VALID |
| CARTONS_IND_1 | NORMAL | NONUNIQUE | AIRWAY_BILL_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
