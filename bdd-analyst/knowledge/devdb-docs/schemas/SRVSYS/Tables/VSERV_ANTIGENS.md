---
tags:
  - table
  - SRVSYS
---
# VSERV_ANTIGENS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 136
**Last Analyzed**: 2026-05-12 03:00:10
**Partitioned**: NO

> [!quote] Created from Entity VALID ANTIGEN by WADLEY on 01-JUL-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_ID | VARCHAR2(10) | No |  |  |
| 2 | ANTIGEN_DESC | VARCHAR2(50) | No |  |  |
| 3 | PRICE | NUMBER(9,2) | Yes |  |  |
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
| VSERV_ANTIGENS_IDX_1 | NORMAL | NONUNIQUE | ANTIGEN_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_ANTIGENS_BD|VSERV_ANTIGENS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ANTIGENS_BI|VSERV_ANTIGENS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ANTIGENS_BU|VSERV_ANTIGENS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
