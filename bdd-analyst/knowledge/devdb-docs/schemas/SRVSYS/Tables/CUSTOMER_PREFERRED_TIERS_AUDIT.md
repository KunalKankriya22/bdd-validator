---
tags:
  - table
  - SRVSYS
---
# CUSTOMER_PREFERRED_TIERS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 86
**Last Analyzed**: 2025-09-16 03:16:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | TIER | NUMBER(2) | Yes |  |  |
| 5 | ALTERNATE_TIER_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CUST_PREFERRED_TIERS_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
