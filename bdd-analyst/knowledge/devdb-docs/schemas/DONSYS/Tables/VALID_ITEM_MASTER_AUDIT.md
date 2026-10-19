---
tags:
  - table
  - DONSYS
---
# VALID_ITEM_MASTER_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 171
**Last Analyzed**: 2025-09-16 03:14:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ITEM_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | ITEM_DESC | VARCHAR2(50) | Yes |  |  |
| 7 | LOT_REQD | VARCHAR2(1) | Yes |  |  |
| 8 | AVG_COST | NUMBER(8,2) | Yes |  |  |
| 9 | ENFORCE_EXIPIRATION | VARCHAR2(1) | Yes |  |  |
| 10 | RESOURCE_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | MINIMUM_LEVEL | NUMBER(4) | Yes |  |  |
| 12 | REORDER_LEVEL | NUMBER(4) | Yes |  |  |
| 13 | RETURN_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | QTY_ON_HAND | NUMBER(4) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
