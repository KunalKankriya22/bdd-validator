---
tags:
  - table
  - SRVSYS
---
# ANTIGEN_PRICING_MATRIX

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11
**Last Analyzed**: 2025-09-16 03:16:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_QTY | NUMBER(3) | No |  |  |
| 2 | STD_PRICE | NUMBER(7,2) | No |  |  |
| 3 | SERVICE_CODE | VARCHAR2(12) | No |  |  |
| 4 | ANTIGEN_DESC | VARCHAR2(50) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ANTIGEN_PRICING_MATRIX_IDX_1 | NORMAL | UNIQUE | ANTIGEN_QTY | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/ANTIGEN_PRICING_MATRIX_BD|ANTIGEN_PRICING_MATRIX_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/ANTIGEN_PRICING_MATRIX_BI|ANTIGEN_PRICING_MATRIX_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/ANTIGEN_PRICING_MATRIX_BU|ANTIGEN_PRICING_MATRIX_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
