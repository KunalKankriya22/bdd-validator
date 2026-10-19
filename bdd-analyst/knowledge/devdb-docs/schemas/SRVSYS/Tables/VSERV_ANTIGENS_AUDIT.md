---
tags:
  - table
  - SRVSYS
---
# VSERV_ANTIGENS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3662
**Last Analyzed**: 2026-04-29 03:00:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_ID | VARCHAR2(10) | Yes |  |  |
| 2 | ANTIGEN_DESC | VARCHAR2(50) | Yes |  |  |
| 3 | PRICE | NUMBER(9,2) | Yes |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
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
| VSERV_ANTIGENS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
