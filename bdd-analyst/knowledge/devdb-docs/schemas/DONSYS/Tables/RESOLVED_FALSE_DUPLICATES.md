---
tags:
  - table
  - DONSYS
---
# RESOLVED_FALSE_DUPLICATES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 692
**Last Analyzed**: 2025-09-16 03:14:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID_1 | VARCHAR2(10) | Yes |  |  |
| 2 | DONOR_ID_2 | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESOLVED_FALSE_DUPLICATES_IDX2 | NORMAL | NONUNIQUE | DONOR_ID_2 | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
