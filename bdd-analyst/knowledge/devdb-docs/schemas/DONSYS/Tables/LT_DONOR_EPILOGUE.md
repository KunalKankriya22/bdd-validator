---
tags:
  - table
  - DONSYS
---
# LT_DONOR_EPILOGUE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 123
**Last Analyzed**: 2025-09-16 03:13:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SEQ_NO | VARCHAR2(6) | Yes |  |  |
| 2 | STILL_SEC | NUMBER(4) | Yes |  |  |
| 3 | FONT_SIZE | NUMBER(4) | Yes |  |  |
| 4 | BACKGROUND_COLOR | VARCHAR2(10) | Yes |  |  |
| 5 | FOREGROUND_COLOR | VARCHAR2(10) | Yes |  |  |
| 6 | TEXT_COLOR | VARCHAR2(10) | Yes |  |  |
| 7 | DISPLAY_TEXT | VARCHAR2(100) | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | FILE_ID | VARCHAR2(10) | Yes |  |  |

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
