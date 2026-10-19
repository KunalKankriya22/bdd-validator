---
tags:
  - table
  - DONSYS
---
# VALID_EQUIP_SUP_DEPENDENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19
**Last Analyzed**: 2026-04-24 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DEVICE_TYPE | VARCHAR2(10) | No |  |  |
| 2 | EQUIP_SUPPLY_CODE | VARCHAR2(10) | No |  |  |
| 3 | DEPENDANT_CODE | VARCHAR2(10) | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | AUDIT_KEY | NUMBER | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | SOURCE_PARM_CODE | VARCHAR2(10) | Yes |  |  |
| 11 | AFFECTED_PARM_CODE | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_EQUIP_SUP_DEPENDENTS_BI|VALID_EQUIP_SUP_DEPENDENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
