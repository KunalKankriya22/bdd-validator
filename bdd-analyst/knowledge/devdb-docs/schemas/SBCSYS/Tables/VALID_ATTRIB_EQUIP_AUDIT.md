---
tags:
  - table
  - SBCSYS
---
# VALID_ATTRIB_EQUIP_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 334
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 3 | EQUIP_TYPE | VARCHAR2(4) | No |  |  |
| 4 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 11 | AUDIT_INSERT_DATE | DATE | Yes |  |  |

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
