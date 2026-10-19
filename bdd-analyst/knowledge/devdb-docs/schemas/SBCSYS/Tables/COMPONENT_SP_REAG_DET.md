---
tags:
  - table
  - SBCSYS
---
# COMPONENT_SP_REAG_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 157
**Last Analyzed**: 2025-09-16 03:14:25
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | KIT_ID | NUMBER | No |  |  |
| 2 | REAGENT_NAME | VARCHAR2(50) | No |  |  |
| 3 | MANUFACTURER | VARCHAR2(50) | No |  |  |
| 4 | LOT_NUMBER | VARCHAR2(50) | No |  |  |
| 5 | EXP_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_SP_REAG_DET_IDX_1 | NORMAL | NONUNIQUE | KIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
