---
tags:
  - table
  - SBCSYS
---
# GROUP_SITES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8510
**Last Analyzed**: 2026-02-17 04:00:16
**Partitioned**: NO

> [!quote] Created from Entity SITE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | GROUP_SITE_ID | VARCHAR2(7) | No |  |  |
| 2 | GROUP_SITE_IND | VARCHAR2(1) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | SITE_NAME | VARCHAR2(50) | No |  |  |
| 5 | ADDRESS_ID | NUMBER(6) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 9 | OSOK_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**GROUP_SITES_PK**: `GROUP_SITE_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GROUP_SITES_IDX_1 | NORMAL | UNIQUE | GROUP_SITE_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
