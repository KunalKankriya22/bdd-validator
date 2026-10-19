---
tags:
  - table
  - SRVSYS
---
# VSERV_BOX_CAPACITY

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 102
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_TYPE | VARCHAR2(2) | No |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | CAPACITY | NUMBER(4) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_BOX_CAPACITY_IDX_1 | NORMAL | UNIQUE | BOX_TYPE, PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_BOX_CAPACT_BEFORE_DEL|VSERV_BOX_CAPACT_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_BOX_CAPACT_BEFORE_INS|VSERV_BOX_CAPACT_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_BOX_CAPACT_BEFORE_UP|VSERV_BOX_CAPACT_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
