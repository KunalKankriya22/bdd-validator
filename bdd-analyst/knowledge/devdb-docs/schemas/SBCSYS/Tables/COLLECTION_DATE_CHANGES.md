---
tags:
  - table
  - SBCSYS
---
# COLLECTION_DATE_CHANGES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 709
**Last Analyzed**: 2026-05-23 03:00:14
**Partitioned**: NO

> [!quote] Created from Entity COLLECTION DATE CHANGE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | OLD_COLL_DATE | DATE | No |  |  |
| 5 | INSERT_DATS | DATE | No |  |  |
| 6 | CHANGE_USER_ID | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COLLECTION_DATE_CHANGES_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
