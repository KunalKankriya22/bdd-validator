---
tags:
  - table
  - SRVSYS
---
# VSERV_CHARGE_CODES_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1367
**Last Analyzed**: 2026-05-24 11:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHARGE_CODE | VARCHAR2(5) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CHARGE_CODE_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | CHARGE_CODE_TYPE | VARCHAR2(2) | Yes |  |  |
| 5 | CHARGE | NUMBER(9,2) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 10 | PERCENT_DISC_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 14 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 15 | SHIP_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | CR_NCR | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CHARGE_CODES_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
