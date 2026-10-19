---
tags:
  - table
  - SRVSYS
---
# VSERV_BILLING_CODES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 326
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BILLING_CODE | VARCHAR2(12) | No |  |  |
| 2 | CODE_DESC | VARCHAR2(50) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | Yes |  |  |
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
| VSERV_BILLING_CODES_IDX1 | NORMAL | UNIQUE | BILLING_CODE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_BILLING_CODES_BD|VSERV_BILLING_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_BILLING_CODES_BI|VSERV_BILLING_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_BILLING_CODES_BU|VSERV_BILLING_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
