---
tags:
  - table
  - DONSYS
---
# VALID_CHECKOUT_ITEMS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_ID | VARCHAR2(10) | No |  |  |
| 4 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 5 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_CHECKOUT_ITEMS_PK**: `DONATION_TYPE, CHAPTER_ID, ITEM_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_CHECKOUT_ITEMS_PK | NORMAL | UNIQUE | DONATION_TYPE, CHAPTER_ID, ITEM_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_CHECKOUT_ITEMS_BD|VALID_CHECKOUT_ITEMS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_CHECKOUT_ITEMS_BI|VALID_CHECKOUT_ITEMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_CHECKOUT_ITEMS_BU|VALID_CHECKOUT_ITEMS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
