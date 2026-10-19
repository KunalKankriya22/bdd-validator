---
tags:
  - table
  - DONSYS
---
# VEQUIP_PARMS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | ARRANGE_BY | NUMBER(4) | Yes |  |  |
| 7 | REF_NUMBER | NUMBER(4) | Yes |  |  |
| 8 | PARM_DESC | VARCHAR2(50) | Yes |  |  |
| 9 | REQUIRED_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | VALID_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | TYPE_OF_DATA | VARCHAR2(8) | Yes |  |  |
| 12 | EFF_DATE | DATE | Yes |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |

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
