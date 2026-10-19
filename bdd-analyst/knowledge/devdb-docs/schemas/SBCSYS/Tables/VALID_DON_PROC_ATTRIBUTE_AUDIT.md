---
tags:
  - table
  - SBCSYS
---
# VALID_DON_PROC_ATTRIBUTE_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 187
**Last Analyzed**: 2026-04-23 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 3 | SORT_SEQUENCE | NUMBER | Yes |  |  |
| 4 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 5 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

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
