---
tags:
  - table
  - SBCSYS
---
# COMPONENT_ATTRIBUTES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 21585
**Last Analyzed**: 2025-09-20 03:00:32
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
| 9 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 10 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 11 | INSERT_DATS | DATE | Yes |  |  |
| 12 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 13 | PROC_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMP_ATTR_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
