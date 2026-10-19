---
tags:
  - table
  - DONSYS
---
# DONOR_LIST_CRITERIA

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3204
**Last Analyzed**: 2025-09-16 03:13:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LIST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CRITERION_NAME | VARCHAR2(25) | No |  |  |
| 4 | OPERATOR_VALUE | VARCHAR2(10) | No |  |  |
| 5 | CRITERION_VALUE | VARCHAR2(2000) | No |  |  |
| 6 | VALUE_STYLE | VARCHAR2(1) | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DONOR_LIST_CRITERIA_PK**: `LIST_ID, CHAPTER_ID, CRITERION_NAME, OPERATOR_VALUE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LIST_CRITERIA_IDX1 | NORMAL | NONUNIQUE | LIST_ID, CHAPTER_ID | VALID |
| DONOR_LIST_CRITERIA_PK | NORMAL | UNIQUE | LIST_ID, CHAPTER_ID, CRITERION_NAME, OPERATOR_VALUE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_LIST_CRITERIA_BI|DONOR_LIST_CRITERIA_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
