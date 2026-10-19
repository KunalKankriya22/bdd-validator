---
tags:
  - table
  - SRVSYS
---
# VSERV_ABO_COMPATIBILITY_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4168
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REQUEST_ABO | VARCHAR2(4) | Yes |  |  |
| 2 | COMPATIBLE_ABO | VARCHAR2(4) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 6 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ABO_COMPAT_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
