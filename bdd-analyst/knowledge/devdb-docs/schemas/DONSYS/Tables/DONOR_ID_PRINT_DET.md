---
tags:
  - table
  - DONSYS
---
# DONOR_ID_PRINT_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 64714
**Last Analyzed**: 2025-09-16 03:11:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 4 | COLL_DATE | DATE | Yes |  |  |
| 5 | PRINT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_ID_PRINT_DET_D1 | NORMAL | NONUNIQUE | DONOR_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
