---
tags:
  - table
  - SRVSYS
---
# ANTIGEN_PRICING_MATRIX_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 66
**Last Analyzed**: 2025-09-16 03:16:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_QTY | NUMBER(3) | Yes |  |  |
| 2 | STD_PRICE | NUMBER(7,2) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 7 | ANTIGEN_DESC | VARCHAR2(50) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ANTGN_PRICING_MAT_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
