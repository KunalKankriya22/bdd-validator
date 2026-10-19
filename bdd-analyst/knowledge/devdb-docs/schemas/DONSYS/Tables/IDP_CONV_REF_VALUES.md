---
tags:
  - table
  - DONSYS
---
# IDP_CONV_REF_VALUES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 148
**Last Analyzed**: 2026-05-13 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONV_REF_VALUE_ID | NUMBER(9) | No |  |  |
| 2 | SOURCE_ID | VARCHAR2(20) | No | 'Vista' |  |
| 3 | TARGET_ID | VARCHAR2(20) | No | 'Lifetrak' |  |
| 4 | SOURCE_CODE_TYPE | VARCHAR2(30) | No |  |  |
| 5 | TARGET_CODE_TYPE | VARCHAR2(30) | No |  |  |
| 6 | SOURCE_VALUE | VARCHAR2(20) | No |  |  |
| 7 | TARGET_VALUE | VARCHAR2(20) | Yes |  |  |
| 8 | SOURCE_TABLE | VARCHAR2(30) | Yes |  |  |
| 9 | SOURCE_COLUMN | VARCHAR2(30) | Yes |  |  |
| 10 | TARGET_TABLE | VARCHAR2(30) | Yes |  |  |
| 11 | TARGET_COLUMN | VARCHAR2(30) | Yes |  |  |
| 12 | CONVERSION_COMMENT | VARCHAR2(240) | Yes |  |  |
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | CONV_PROC_CALL | VARCHAR2(80) | Yes |  |  |

## Primary Key

**CONV_REF_VALUE_PK**: `CONV_REF_VALUE_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| CONV_REF_VALUE_UK | SOURCE_ID, TARGET_ID, SOURCE_CODE_TYPE, TARGET_CODE_TYPE, SOURCE_VALUE, TARGET_VALUE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONV_REF_VALUE_PK | NORMAL | UNIQUE | CONV_REF_VALUE_ID | VALID |
| CONV_REF_VALUE_UK | NORMAL | UNIQUE | SOURCE_ID, TARGET_ID, SOURCE_CODE_TYPE, TARGET_CODE_TYPE, SOURCE_VALUE, TARGET_VALUE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/IDP_CONVERSION_BI|IDP_CONVERSION_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
