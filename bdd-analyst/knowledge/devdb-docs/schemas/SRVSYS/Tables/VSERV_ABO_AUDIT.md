---
tags:
  - table
  - SRVSYS
---
# VSERV_ABO_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 957
**Last Analyzed**: 2026-03-18 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ABO_CODE | VARCHAR2(5) | Yes |  |  |
| 2 | ABO_DESC | VARCHAR2(20) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 5 | ABO_ENTRY_1 | VARCHAR2(12) | Yes |  |  |
| 6 | ABO_ENTRY_2 | VARCHAR2(12) | Yes |  |  |
| 7 | DISCARD_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | TRANSFUSABLE_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 11 | ABO_SEQ | NUMBER(2) | Yes |  |  |
| 12 | ORDER_ABO_GROUP | VARCHAR2(5) | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 15 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 16 | AUDIT_INSERT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_ABO_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
