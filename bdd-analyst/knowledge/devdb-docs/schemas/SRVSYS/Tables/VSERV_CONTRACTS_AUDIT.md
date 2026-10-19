---
tags:
  - table
  - SRVSYS
---
# VSERV_CONTRACTS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1107
**Last Analyzed**: 2025-09-16 03:16:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 4 | CREDIT_LIMIT | NUMBER(9,2) | Yes |  |  |
| 5 | AGREED_AMOUNT | NUMBER(9,2) | Yes |  |  |
| 6 | DISCOUNT | NUMBER(9,2) | Yes |  |  |
| 7 | USED_CREDIT | NUMBER(9,2) | Yes |  |  |
| 8 | HOSPITAL_LEVEL | VARCHAR2(2) | Yes |  |  |
| 9 | START_TERM | DATE | Yes |  |  |
| 10 | END_TERM | DATE | Yes |  |  |
| 11 | MAX_DISCOUNT_PCT | NUMBER(5,2) | Yes |  |  |
| 12 | ROTATION_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | PO_NUMBER | VARCHAR2(12) | Yes |  |  |
| 14 | SUBSTITUTE_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 21 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CONTRACTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
