---
tags:
  - table
  - SBCSYS
---
# VALID_EXP_DATE_OVR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 31
**Last Analyzed**: 2026-05-15 03:00:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 2 | OVR_ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | MODIFIED_DATE | DATE | Yes |  |  |
| 6 | MODIFIED_USER | VARCHAR2(30) | Yes |  |  |
| 7 | OLD_ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 8 | OLD_OVR_ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |

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
