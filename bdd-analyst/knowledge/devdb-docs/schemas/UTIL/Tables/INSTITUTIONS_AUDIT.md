---
tags:
  - table
  - UTIL
---
# INSTITUTIONS_AUDIT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 518
**Last Analyzed**: 2026-04-18 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 2 | INST_NAME | VARCHAR2(50) | Yes |  |  |
| 3 | INST_SHORT_NAME | VARCHAR2(80) | Yes |  |  |
| 4 | ADDRESS_ID | NUMBER(6) | Yes |  |  |
| 5 | PRINT_HDR | VARCHAR2(50) | Yes |  |  |
| 6 | SYSTEM_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | CODABAR_UNIT_SCHEME | VARCHAR2(1) | Yes |  |  |
| 8 | TAX_ID | VARCHAR2(9) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 15 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
