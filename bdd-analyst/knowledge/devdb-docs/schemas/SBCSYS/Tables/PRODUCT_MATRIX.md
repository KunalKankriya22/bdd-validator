---
tags:
  - table
  - SBCSYS
---
# PRODUCT_MATRIX

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 189
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

> [!quote] Created from Entity PRODUCT MATRIX by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BAG_CODE | VARCHAR2(4) | No |  |  |
| 2 | SET_ID | NUMBER(4) | No |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**PRODUCT_MATRIX_PK**: `BAG_CODE, SET_ID, PRODUCT_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_MATRIX_IDX_1 | NORMAL | UNIQUE | BAG_CODE, SET_ID, PRODUCT_TYPE | VALID |
| PRODUCT_MATRIX_IDX_2 | NORMAL | NONUNIQUE | BAG_CODE, PRODUCT_TYPE | VALID |
| PRODUCT_MATRIX_IDX_3 | NORMAL | NONUNIQUE | SET_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/PRODUCT_MATRIX_BEFORE_DELETE|PRODUCT_MATRIX_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/PRODUCT_MATRIX_DELETE|PRODUCT_MATRIX_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/PRODUCT_MATRIX_INSERT_UPDATE|PRODUCT_MATRIX_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
