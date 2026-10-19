---
tags:
  - table
  - DONSYS
---
# VALID_INTERDICTIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 831
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 2 | INTER_TYPE | VARCHAR2(5) | No |  |  |
| 3 | ALLOW_MULTIPLE | VARCHAR2(1) | No |  |  |
| 4 | INTER_DESC | VARCHAR2(50) | Yes |  |  |
| 5 | VIEW_LEVEL | NUMBER(4) | Yes |  |  |
| 6 | DEFERRAL_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | FIXED_PERIOD | VARCHAR2(1) | Yes |  |  |
| 8 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 9 | PERIOD_NUMBER | NUMBER(4) | Yes |  |  |
| 10 | MINIMUM_PERIOD | NUMBER(4) | Yes |  |  |
| 11 | INTER_OWNER | VARCHAR2(1) | Yes |  |  |
| 12 | DONOR_INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 13 | UPM_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | TERM_REASON_REQ | VARCHAR2(1) | Yes |  |  |
| 15 | EFF_DATE | DATE | No |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | INSERT_DATE | DATE | No |  |  |
| 19 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | AUDIT_KEY | NUMBER | No |  |  |
| 21 | OLD_INTER | VARCHAR2(5) | Yes |  |  |
| 22 | LAB_INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 23 | LAB_HOLD_FLAG | VARCHAR2(1) | Yes |  |  |
| 24 | MANUAL_HOLD_FLAG | VARCHAR2(1) | Yes |  |  |
| 25 | CHANGE_CONTROL_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_INTERDICTIONS_PK**: `INTER_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INTERDICTIONS_PK | NORMAL | UNIQUE | INTER_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_INTERDICTIONS_BD|VALID_INTERDICTIONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_INTERDICTIONS_BI|VALID_INTERDICTIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_INTERDICTIONS_BU|VALID_INTERDICTIONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| GENBDR | PACKAGE | DONSYS |
