---
tags:
  - table
  - SBCSYS
---
# CUSTOM_CONTRACTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 238
**Last Analyzed**: 2025-09-16 03:14:26
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | RECEIVED_DATE | DATE | No |  |  |
| 4 | CONTRACT_SUFFIX | VARCHAR2(4) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | No |  |  |
| 6 | BATCH_ID | VARCHAR2(14) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CUSTOM_CONTRACTS_PK1 | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID, RECEIVED_DATE, CONTRACT_SUFFIX, TEST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
