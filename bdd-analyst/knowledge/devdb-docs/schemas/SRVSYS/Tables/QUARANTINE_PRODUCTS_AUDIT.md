---
tags:
  - table
  - SRVSYS
---
# QUARANTINE_PRODUCTS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 516
**Last Analyzed**: 2025-09-16 03:16:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 4 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER_ID | VARCHAR2(10) | Yes |  |  |
| 7 | QU_REASON | VARCHAR2(5) | Yes |  |  |
| 8 | COLL_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| QUARANTINE_PRODUCTS_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
