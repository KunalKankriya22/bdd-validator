---
tags:
  - table
  - SRVSYS
---
# VSERV_ABO_COMPATIBILITY

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 967
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REQUEST_ABO | VARCHAR2(4) | No |  |  |
| 2 | COMPATIBLE_ABO | VARCHAR2(4) | No |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
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
| VSERV_ABO_COMPAT_IDX_1 | NORMAL | UNIQUE | PRODUCT_TYPE, REQUEST_ABO, COMPATIBLE_ABO | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_ABO_COMPATIBILITY_BD|VSERV_ABO_COMPATIBILITY_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ABO_COMPATIBILITY_BI|VSERV_ABO_COMPATIBILITY_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ABO_COMPATIBILITY_BU|VSERV_ABO_COMPATIBILITY_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
