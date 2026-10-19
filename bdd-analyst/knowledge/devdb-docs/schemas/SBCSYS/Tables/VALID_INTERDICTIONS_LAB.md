---
tags:
  - table
  - SBCSYS
---
# VALID_INTERDICTIONS_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 326
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

> [!quote] Created from Entity VALID INTERDICTION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_CODE | VARCHAR2(4) | No |  |  |
| 2 | INTER_TYPE | VARCHAR2(1) | No |  |  |
| 3 | INTER_DESC | VARCHAR2(50) | No |  |  |
| 4 | SYSTEM_INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 5 | SYSTEM_INTER_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | CHANGE_CONTROL_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INTERDICTIONS_IDX_1 | NORMAL | UNIQUE | INTER_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INTERDICTIONS_LAB_BD|VALID_INTERDICTIONS_LAB_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTERDICTIONS_LAB_BIU|VALID_INTERDICTIONS_LAB_BIU]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
