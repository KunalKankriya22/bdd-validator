---
tags:
  - table
  - UTIL
---
# FCN_MENU_ITEMS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1177
**Last Analyzed**: 2026-05-09 11:00:42
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | FCN_ID | NUMBER(6) | No |  |  |
| 3 | MENU_ID | NUMBER(6) | No |  |  |
| 4 | DESCRIP | VARCHAR2(40) | No |  |  |
| 5 | SEQUENCE | NUMBER(2) | Yes |  |  |
| 6 | ACC_LVL | VARCHAR2(40) | Yes |  |  |
| 7 | P1_VALUE | VARCHAR2(20) | Yes |  |  |
| 8 | P2_VALUE | VARCHAR2(20) | Yes |  |  |
| 9 | P3_VALUE | VARCHAR2(20) | Yes |  |  |
| 10 | MNEMONIC | VARCHAR2(8) | No |  |  |
| 11 | ITEM_HIDE | VARCHAR2(1) | Yes |  |  |
| 12 | REMARKS | VARCHAR2(120) | Yes |  |  |
| 13 | FCN_ICON | VARCHAR2(100) | Yes |  |  |

## Primary Key

**FCN_MENU_ITEMS_PK**: `APPL_ID, FCN_ID, MENU_ID, MNEMONIC`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FCN_MENU_ITEMS_IDX1 | NORMAL | UNIQUE | APPL_ID, MNEMONIC | VALID |
| FCN_MENU_ITEMS_PK | NORMAL | UNIQUE | APPL_ID, FCN_ID, MENU_ID, MNEMONIC | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
