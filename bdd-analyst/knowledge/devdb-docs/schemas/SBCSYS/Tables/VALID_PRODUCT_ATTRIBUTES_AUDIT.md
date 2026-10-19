---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_ATTRIBUTES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2219
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 4 | LIFE_SPAN_IND | VARCHAR2(1) | Yes |  |  |
| 5 | LIFE_SPAN | VARCHAR2(4) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | NEW_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 14 | LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 16 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PROD_ATTR_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
