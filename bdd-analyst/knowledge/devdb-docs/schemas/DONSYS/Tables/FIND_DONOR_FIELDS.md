---
tags:
  - table
  - DONSYS
---
# FIND_DONOR_FIELDS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 180
**Last Analyzed**: 2026-04-21 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROGRAM_NAME | VARCHAR2(10) | No |  |  |
| 2 | FIELD_NAME | VARCHAR2(50) | No |  |  |
| 3 | NO_OF_ENTRIES | NUMBER(3) | No |  |  |
| 4 | REQUIRED | VARCHAR2(1) | Yes |  |  |
| 5 | PROTECTED_ENTRY | VARCHAR2(1) | Yes |  |  |
| 6 | FUNCTION_CHECK | VARCHAR2(1) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/FIND_DONOR_FIELDS_BD|FIND_DONOR_FIELDS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/FIND_DONOR_FIELDS_BI|FIND_DONOR_FIELDS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/FIND_DONOR_FIELDS_BU|FIND_DONOR_FIELDS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
