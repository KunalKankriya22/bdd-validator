---
tags:
  - table
  - SBCSYS
---
# CONTRACT_TESTS_IMAGE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2258
**Last Analyzed**: 2025-09-16 03:14:26
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | STOP_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | PROFILE_SEQ_NO | NUMBER(6) | Yes |  |  |
| 11 | INTERFACE_COLUMN | NUMBER(2) | Yes |  |  |
| 12 | INTERFACE_LENGTH | NUMBER(1) | Yes |  |  |
| 13 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 14 | ELECTRONIC_FILE_FLAG | VARCHAR2(1) | Yes |  |  |

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
