---
tags:
  - table
  - SRVSYS
---
# VSERV_PS_MATRIX

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 83
**Last Analyzed**: 2026-04-25 03:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | WORK_OP | VARCHAR2(6) | No |  |  |
| 2 | SRC_PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | END_PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
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
| VSERV_PS_MATRIX_IDX_1 | NORMAL | UNIQUE | WORK_OP, SRC_PRODUCT_TYPE, END_PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_PS_MATRIX_BEFORE_DEL|VSERV_PS_MATRIX_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PS_MATRIX_BEFORE_INSERT|VSERV_PS_MATRIX_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PS_MATRIX_BEFORE_UP|VSERV_PS_MATRIX_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
