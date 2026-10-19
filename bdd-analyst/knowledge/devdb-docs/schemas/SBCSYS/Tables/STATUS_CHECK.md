---
tags:
  - table
  - SBCSYS
---
# STATUS_CHECK

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ARCH_DATE | DATE | No |  |  |
| 2 | INSERT_FLAG | VARCHAR2(1) | No |  |  |
| 3 | DELETE_FLAG | VARCHAR2(1) | No |  |  |
| 4 | EXPORT_FLAG | VARCHAR2(1) | No |  |  |
| 5 | BACKUP_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
