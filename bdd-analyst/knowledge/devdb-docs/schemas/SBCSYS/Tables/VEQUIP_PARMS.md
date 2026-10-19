---
tags:
  - table
  - SBCSYS
---
# VEQUIP_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24
**Last Analyzed**: 2025-09-26 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | ARRANGE_BY | NUMBER(4) | Yes |  |  |
| 3 | REF_NUMBER | NUMBER(4) | Yes |  |  |
| 4 | PARM_DESC | VARCHAR2(50) | Yes |  |  |
| 5 | REQUIRED_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | VALID_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | TYPE_OF_DATA | VARCHAR2(8) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
