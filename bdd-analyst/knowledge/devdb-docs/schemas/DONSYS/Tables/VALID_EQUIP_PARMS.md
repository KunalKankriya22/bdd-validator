---
tags:
  - table
  - DONSYS
---
# VALID_EQUIP_PARMS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 135
**Last Analyzed**: 2026-04-23 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DEVICE_TYPE | VARCHAR2(10) | No |  |  |
| 2 | EQUIP_SUPPLY | VARCHAR2(10) | No |  |  |
| 3 | QC_TEST_PARM_CODE | VARCHAR2(10) | No |  |  |
| 4 | QC_CONDITION_CODE | VARCHAR2(10) | No |  |  |
| 5 | QC_ACCPT_VALUE | VARCHAR2(50) | Yes |  |  |
| 6 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 7 | VALUE_TYPE | VARCHAR2(50) | Yes |  |  |
| 8 | SCAN_ALLOWED | VARCHAR2(1) | Yes |  |  |
| 9 | RANGE_REQUIRED | VARCHAR2(1) | Yes |  |  |
| 10 | RANGE_VALUE | NUMBER | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 16 | INSERT_DATE | DATE | Yes |  |  |
| 17 | SORT_SEQUENCE | NUMBER | Yes |  |  |
| 18 | BRANCH_SEQ | NUMBER(3) | Yes |  |  |
| 19 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_EQUIP_PARMS_BD|VALID_EQUIP_PARMS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_EQUIP_PARMS_BI|VALID_EQUIP_PARMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_EQUIP_PARMS_BU|VALID_EQUIP_PARMS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
