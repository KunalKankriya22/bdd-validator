---
tags:
  - table
  - SBCSYS
---
# VALID_PROCPROD_MATRIX

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 30
**Last Analyzed**: 2025-09-16 03:16:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROC | VARCHAR2(2) | Yes |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | LAST_MODIFY_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | AUDIT_KEY | NUMBER | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | NUMBER_PRODUCTS | NUMBER(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PROCPROD_IDX_1 | NORMAL | UNIQUE | PROC, PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PROCPROD_BEFORE_DELETE|VALID_PROCPROD_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PROCPROD_INSERT_UPDATE|VALID_PROCPROD_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
