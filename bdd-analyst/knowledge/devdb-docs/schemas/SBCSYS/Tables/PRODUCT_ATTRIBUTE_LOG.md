---
tags:
  - table
  - SBCSYS
---
# PRODUCT_ATTRIBUTE_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4242
**Last Analyzed**: 2025-09-17 03:00:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | OLD_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 3 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | NEW_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 6 | ATTRIB_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATS | DATE | Yes |  |  |
| 8 | INVALID_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 10 | COLL_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_ATTRIBUTE_LOG_IDX1 | NORMAL | NONUNIQUE | NEW_PRODUCT_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
