---
tags:
  - table
  - UTIL
---
# HELP_STATUS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 273
**Last Analyzed**: 2025-09-16 03:16:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | REF_NO | VARCHAR2(10) | No |  |  |
| 3 | FORM_NAME | VARCHAR2(10) | No |  |  |
| 4 | MNEMONIC_NAME | VARCHAR2(10) | No |  |  |
| 5 | DESCRIPTION | VARCHAR2(40) | No |  |  |
| 6 | VERSION_NO | NUMBER(4,2) | Yes |  |  |
| 7 | VERSION_DATE | DATE | Yes |  |  |
| 8 | UPD_BY | VARCHAR2(10) | Yes |  |  |
| 9 | UPD_DATE | DATE | Yes |  |  |
| 10 | SORT_SEQ | NUMBER(5) | Yes |  |  |

## Primary Key

**HELP_STATUS_PK**: `APPL_ID, FORM_NAME, MNEMONIC_NAME`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| APPL_HELP_STATUS_FK | APPL_ID | [[schemas/UTIL/Tables/APPLICATIONS\|UTIL.APPLICATIONS]] (APPL_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HELP_STATUS_PK | NORMAL | UNIQUE | APPL_ID, FORM_NAME, MNEMONIC_NAME | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
