---
tags:
  - package
  - SBCSYS
---
# GENERATE_SERIES_REPORT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "GENERATE_SERIES_REPORT"
IS
  /*
  Created By : M. Ansell
  Created On : 10/8/2018
  Purpose    : To populate the RPT_PARM and RPT_PARM_SELECT tables based on
  records in the CNF_RPT_PARM_SELECT table
  Version    : 01 (MLT-870)
  Version    : 02 (MLT-967) After time query added to cnf_rpt_cur
  ---------------------------------------------------------------------------------
  */
PROCEDURE pop_rpt_parm_tables
                             (
                               pl_report_id   IN VARCHAR2 ,
                               pl_user_id     IN VARCHAR2 ,
                               pl_chapter_id  IN VARCHAR2 ,
                               pl_mode        IN VARCHAR2 ,
                               pl_start_time  IN DATE
                             ) ;
END generate_series_report;

```
