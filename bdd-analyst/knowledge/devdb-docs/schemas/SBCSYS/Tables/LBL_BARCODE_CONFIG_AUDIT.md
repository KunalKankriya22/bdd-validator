---
tags:
  - table
  - SBCSYS
---
# LBL_BARCODE_CONFIG_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 75
**Last Analyzed**: 2026-04-22 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BARCODE_VALUE | VARCHAR2(10) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | RESULT_CODE | VARCHAR2(10) | No |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 12 | PRIORITY_SEQ | NUMBER(3) | No |  |  |

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
