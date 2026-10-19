---
tags:
  - table
  - SBCSYS
---
# BAR_CODE_PREFIXES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 102
**Last Analyzed**: 2026-04-18 03:00:07
**Partitioned**: NO

> [!quote] Created from Entity BAR CODE PREFIX by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MACHINE_CODE | VARCHAR2(2) | No |  |  |
| 2 | EYE_READ_TRNS | VARCHAR2(2) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BAR_CODE_PREFIXES_IND_1 | NORMAL | UNIQUE | MACHINE_CODE | VALID |
| BAR_CODE_PREFIXES_IND_2 | NORMAL | UNIQUE | EYE_READ_TRNS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
