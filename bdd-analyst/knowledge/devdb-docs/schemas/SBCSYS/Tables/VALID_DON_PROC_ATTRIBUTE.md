---
tags:
  - table
  - SBCSYS
---
# VALID_DON_PROC_ATTRIBUTE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 66
**Last Analyzed**: 2026-04-23 03:00:06
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

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VDONPROC_ATTR_BEFORE_DELETE|VDONPROC_ATTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VDONPROC_ATTR_INSERT_UPDATE|VDONPROC_ATTR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
