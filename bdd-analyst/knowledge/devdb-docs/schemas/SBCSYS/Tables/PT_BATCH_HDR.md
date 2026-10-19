---
tags:
  - table
  - SBCSYS
---
# PT_BATCH_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 63
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | REVIEWED_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | REVIEWED_DATE | DATE | Yes |  |  |
| 6 | REVIEWED_USER | VARCHAR2(6) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |

## Primary Key

**PT_BATCH_HDR_PK**: `BATCH_ID, TEST_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PT_BATCH_HDR_IDX_1 | NORMAL | UNIQUE | BATCH_ID, TEST_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
