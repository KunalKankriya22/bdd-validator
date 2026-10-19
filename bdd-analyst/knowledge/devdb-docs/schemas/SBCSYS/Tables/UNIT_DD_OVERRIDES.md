---
tags:
  - table
  - SBCSYS
---
# UNIT_DD_OVERRIDES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 144
**Last Analyzed**: 2026-05-23 03:00:15
**Partitioned**: NO

> [!quote] Created from Entity UNIT DD OVERRIDE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | DONOR_DECISION_CODE | VARCHAR2(1) | No |  |  |
| 5 | OVERRIDE_CODE | VARCHAR2(4) | No |  |  |
| 6 | INSERT_DATS | DATE | No |  |  |
| 7 | USER_ID | VARCHAR2(6) | No |  |  |
| 8 | NOTE_ID | NUMBER(10) | Yes |  |  |

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
