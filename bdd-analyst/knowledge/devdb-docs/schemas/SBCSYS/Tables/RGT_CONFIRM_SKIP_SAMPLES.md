---
tags:
  - table
  - SBCSYS
---
# RGT_CONFIRM_SKIP_SAMPLES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | COLL_DATE | DATE | Yes |  |  |
| 4 | SKIP_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 7 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | RESET_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |

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
