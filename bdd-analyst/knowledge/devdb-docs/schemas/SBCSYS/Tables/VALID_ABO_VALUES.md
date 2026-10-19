---
tags:
  - table
  - SBCSYS
---
# VALID_ABO_VALUES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 129
**Last Analyzed**: 2026-04-25 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TESTED_ABO_CODE | VARCHAR2(5) | No |  |  |
| 2 | IDENTIFIER_CODE | VARCHAR2(5) | No |  |  |
| 3 | ABO_LABEL | VARCHAR2(5) | No |  |  |
| 4 | ABO_LABEL_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 6 | ALTERNATE_TESTED_ABO | VARCHAR2(5) | Yes |  |  |
| 7 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | ABO_SHORT_NAME | VARCHAR2(30) | Yes |  |  |
| 14 | USAGE_CODE | VARCHAR2(1) | Yes |  |  |
| 15 | LABEL_PRINTER_CODE | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_ABO_VALUES_BEFORE_DELETE|VALID_ABO_VALUES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_ABO_VALUES_INSERT_UPDATE|VALID_ABO_VALUES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
