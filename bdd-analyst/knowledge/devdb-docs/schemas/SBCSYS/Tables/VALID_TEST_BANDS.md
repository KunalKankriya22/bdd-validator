---
tags:
  - table
  - SBCSYS
---
# VALID_TEST_BANDS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 136
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | TEST_TYPE | VARCHAR2(5) | No |  |  |
| 3 | BAND_SEQ | NUMBER(3) | No |  |  |
| 4 | BAND_NAME | VARCHAR2(6) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER(10) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
