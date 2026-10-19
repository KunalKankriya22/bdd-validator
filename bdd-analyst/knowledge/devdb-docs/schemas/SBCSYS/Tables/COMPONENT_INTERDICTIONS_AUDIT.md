---
tags:
  - table
  - SBCSYS
---
# COMPONENT_INTERDICTIONS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19557
**Last Analyzed**: 2026-05-14 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 3 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 4 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 9 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 10 | INSERT_DATS | DATE | Yes |  |  |
| 11 | INTER_USER_ID | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMP_INTER_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| COMP_INTER_AUDIT_IDX_2 | NORMAL | NONUNIQUE | AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
