---
tags:
  - table
  - SBCSYS
---
# LABELING_TEST_MESSAGE_MAP

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 61
**Last Analyzed**: 2026-03-26 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LT_TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | RESULT_CODE | VARCHAR2(10) | No |  |  |
| 3 | DISPLY_TEST_ID | VARCHAR2(20) | No |  |  |
| 4 | MESSAGE_DESC | VARCHAR2(200) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | ANTIBODY_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**LABELING_TEST_MESSAGE_MAP_PK**: `LT_TEST_ID, RESULT_CODE, DISPLY_TEST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LABELING_TEST_MESSAGE_MAP_PK | NORMAL | UNIQUE | LT_TEST_ID, RESULT_CODE, DISPLY_TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/LABELING_TEST_MESSAGE_MAP_BD|LABELING_TEST_MESSAGE_MAP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/LABELING_TEST_MESSAGE_MAP_BI|LABELING_TEST_MESSAGE_MAP_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/LABELING_TEST_MESSAGE_MAP_BU|LABELING_TEST_MESSAGE_MAP_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
