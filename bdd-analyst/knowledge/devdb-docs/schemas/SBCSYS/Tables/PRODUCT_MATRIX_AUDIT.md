---
tags:
  - table
  - SBCSYS
---
# PRODUCT_MATRIX_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 398
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BAG_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | SET_ID | NUMBER(4) | Yes |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 7 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_MATRIX_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
