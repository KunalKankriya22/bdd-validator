---
tags:
  - table
  - SRVSYS
---
# VSERV_PRODUCT_SUBSTITUTIONS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 69
**Last Analyzed**: 2026-04-22 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REQUEST_PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | COMPATIBLE_PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_PRODUCT_SUB_IDX_1 | NORMAL | UNIQUE | REQUEST_PRODUCT_TYPE, COMPATIBLE_PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_SUB_BEFORE_DEL|VSERV_PRODUCT_SUB_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_SUB_BEFORE_INS|VSERV_PRODUCT_SUB_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_SUB_BEFORE_UP|VSERV_PRODUCT_SUB_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
