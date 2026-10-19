---
tags:
  - table
  - DONSYS
---
# LIST_CRITERIA_VALUES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 12911
**Last Analyzed**: 2025-09-16 03:13:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LIST_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CRITERION_NAME | VARCHAR2(25) | No |  |  |
| 4 | OPERATOR_VALUE | VARCHAR2(10) | No |  |  |
| 5 | CRIT_VALUE_1 | VARCHAR2(20) | No |  |  |
| 6 | CRIT_VALUE_2 | VARCHAR2(20) | Yes |  |  |
| 7 | CRIT_VALUE_3 | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LIST_CRITERIA_VALUES_IDX1 | NORMAL | NONUNIQUE | LIST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
