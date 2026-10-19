---
tags:
  - table
  - DONSYS
---
# VALID_INTERDICTIONS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 7979
**Last Analyzed**: 2026-01-24 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | INTER_TYPE | VARCHAR2(5) | Yes |  |  |
| 7 | ALLOW_MULTIPLE | VARCHAR2(1) | Yes |  |  |
| 8 | INTER_DESC | VARCHAR2(50) | Yes |  |  |
| 9 | VIEW_LEVEL | NUMBER(4) | Yes |  |  |
| 10 | DEFERRAL_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | FIXED_PERIOD | VARCHAR2(1) | Yes |  |  |
| 12 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 13 | PERIOD_NUMBER | NUMBER(4) | Yes |  |  |
| 14 | MINIMUM_PERIOD | NUMBER(4) | Yes |  |  |
| 15 | INTER_OWNER | VARCHAR2(1) | Yes |  |  |
| 16 | DONOR_INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 17 | UPM_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | TERM_REASON_REQ | VARCHAR2(1) | Yes |  |  |
| 19 | EFF_DATE | DATE | Yes |  |  |
| 20 | TERM_DATE | DATE | Yes |  |  |
| 21 | LAB_INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 22 | LAB_HOLD_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | MANUAL_HOLD_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
