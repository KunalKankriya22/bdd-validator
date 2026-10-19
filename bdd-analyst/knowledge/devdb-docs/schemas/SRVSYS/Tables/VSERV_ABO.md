---
tags:
  - table
  - SRVSYS
---
# VSERV_ABO

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 120
**Last Analyzed**: 2026-04-28 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ABO_CODE | VARCHAR2(5) | No |  |  |
| 2 | ABO_DESC | VARCHAR2(20) | No |  |  |
| 3 | ABO_ENTRY_1 | VARCHAR2(12) | Yes |  |  |
| 4 | ABO_ENTRY_2 | VARCHAR2(12) | Yes |  |  |
| 5 | DISCARD_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | TRANSFUSABLE_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 8 | ABO_SEQ | NUMBER(2) | Yes |  |  |
| 9 | ORDER_ABO_GROUP | VARCHAR2(5) | Yes |  |  |
| 10 | EFF_DATE | DATE | No |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 16 | IDENTIFIER_CODE | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ABO_IDX_1 | NORMAL | UNIQUE | ABO_CODE, UNIT_SCHEME_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_ABO_BEFORE_DEL|VSERV_ABO_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ABO_BEFORE_INSERT|VSERV_ABO_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_ABO_BEFORE_UP|VSERV_ABO_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
