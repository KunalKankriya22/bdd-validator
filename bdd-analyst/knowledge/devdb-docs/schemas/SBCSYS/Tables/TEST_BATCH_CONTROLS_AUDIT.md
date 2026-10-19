---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_CONTROLS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 148
**Last Analyzed**: 2025-09-16 03:14:42
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | CUT_OFF_VALUE | VARCHAR2(6) | Yes |  |  |
| 5 | REF_RESULT | VARCHAR2(4) | Yes |  |  |
| 6 | REF_RATIO | VARCHAR2(12) | Yes |  |  |
| 7 | REF_CONTROL | VARCHAR2(15) | Yes |  |  |
| 8 | REF_ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 9 | INSERT_DATS | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
