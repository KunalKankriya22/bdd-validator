---
tags:
  - table
  - SBCSYS
---
# UNIT_RESPINS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 6
**Last Analyzed**: 2026-05-23 03:00:15
**Partitioned**: NO

> [!quote] Created from Entity UNIT RESPIN by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | SPIN_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | SPIN_CENTRIFUGE_ID | VARCHAR2(3) | Yes |  |  |
| 6 | SPIN_DATS | DATE | Yes |  |  |
| 7 | SPIN_USER_ID | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_RESPINS_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
