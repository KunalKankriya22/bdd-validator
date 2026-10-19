---
tags:
  - table
  - DONSYS
---
# VALID_PHYSICAL_RULES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2323
**Last Analyzed**: 2026-04-23 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PHYSICAL_CODE | VARCHAR2(5) | No |  |  |
| 2 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 3 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | GENDER | VARCHAR2(1) | Yes |  |  |
| 6 | FROM_AGE | NUMBER(3) | Yes |  |  |
| 7 | TO_AGE | NUMBER(3) | Yes |  |  |
| 8 | ITEM_VALUE | VARCHAR2(10) | Yes |  |  |
| 9 | ITEM_OPERATOR | VARCHAR2(10) | Yes |  |  |
| 10 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | ITEM_VALUE_MAX | VARCHAR2(10) | Yes |  |  |
| 12 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 13 | EFF_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | INSERT_DATE | DATE | No |  |  |
| 17 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | COMMENT_REQ_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 21 | MANUAL_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| VALID_PHYSICAL_RULES_UK | PHYSICAL_CODE, PROCEDURE_CODE, DONATION_TYPE, CHAPTER_ID, GENDER, ITEM_VALUE, ITEM_VALUE_MAX, DATA_TYPE, FROM_AGE, TO_AGE, EFF_DATE, EQUIP_TYPE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PHYSICAL_RULES_UK | NORMAL | UNIQUE | PHYSICAL_CODE, PROCEDURE_CODE, DONATION_TYPE, CHAPTER_ID, GENDER, ITEM_VALUE, ITEM_VALUE_MAX, DATA_TYPE, FROM_AGE, TO_AGE, EFF_DATE, EQUIP_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_RULES_BD|VALID_PHYSICAL_RULES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_RULES_BI|VALID_PHYSICAL_RULES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_PHYSICAL_RULES_BU|VALID_PHYSICAL_RULES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| DON_NURSING_AUDIT | PACKAGE | DONSYS |
| DON_STD | PACKAGE | DONSYS |
