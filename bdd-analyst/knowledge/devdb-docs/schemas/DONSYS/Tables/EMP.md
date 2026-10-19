---
tags:
  - table
  - DONSYS
---
# EMP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 14
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EMPNO | NUMBER(4) | No |  |  |
| 2 | ENAME | VARCHAR2(10) | Yes |  |  |
| 3 | JOB | VARCHAR2(9) | Yes |  |  |
| 4 | MGR | NUMBER(4) | Yes |  |  |
| 5 | HIREDATE | DATE | Yes |  |  |
| 6 | SAL | NUMBER(7,2) | Yes |  |  |
| 7 | COMM | NUMBER(7,2) | Yes |  |  |
| 8 | DEPTNO | NUMBER(2) | Yes |  |  |

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
