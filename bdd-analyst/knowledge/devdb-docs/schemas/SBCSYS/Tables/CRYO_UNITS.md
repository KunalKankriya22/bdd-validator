---
tags:
  - table
  - SBCSYS
---
# CRYO_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1674
**Last Analyzed**: 2025-09-16 03:14:26
**Partitioned**: NO

> [!quote] Created from Entity CRYO UNIT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | CRYO_WORKSHEET_ID | VARCHAR2(14) | No |  |  |
| 5 | WORKSHEET_SEQ_NO | NUMBER(4) | No |  |  |
| 6 | DUMMY_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 7 | ACTUAL_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 8 | THAW_METHOD | VARCHAR2(4) | Yes |  |  |
| 9 | THAW_TEMPERATURE | NUMBER(5,2) | Yes |  |  |
| 10 | SEP_IND | NUMBER(1) | Yes |  |  |
| 11 | FREEZE_TIME | DATE | Yes |  |  |
| 12 | CRYO_OK_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | REJECT_REASON_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | INSERT_DATS | DATE | No |  |  |
| 15 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 18 | SEP_TIME | DATE | Yes |  |  |
| 19 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CRYO_UNITS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |
| CRYO_UNITS_IDX_2 | NORMAL | NONUNIQUE | INSERT_DATS | VALID |
| CRYO_UNITS_IDX_3 | NORMAL | NONUNIQUE | FREEZE_TIME | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/CRYO_UNITS_BI|CRYO_UNITS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
