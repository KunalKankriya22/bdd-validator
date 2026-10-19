---
tags:
  - table
  - UTIL
---
# HELP_TABLE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | FORM_NAME | VARCHAR2(10) | No |  |  |
| 3 | MNEMONIC_NAME | VARCHAR2(8) | No |  |  |
| 4 | BLOCK_NAME | VARCHAR2(10) | Yes |  |  |
| 5 | FIELD_NAME | VARCHAR2(15) | Yes |  |  |
| 6 | SERIAL_NO | NUMBER(4) | No |  |  |
| 7 | HELP_TEXT | VARCHAR2(70) | Yes |  |  |

## Primary Key

**HELP_TABLE_PK**: `APPL_ID, FORM_NAME, MNEMONIC_NAME, SERIAL_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HELP_TABLE_PK | NORMAL | UNIQUE | APPL_ID, FORM_NAME, MNEMONIC_NAME, SERIAL_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
