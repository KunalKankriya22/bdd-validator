---
tags:
  - package
  - LTAPI
---
# LT_INTERCEPT_PARSER

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE         "LT_INTERCEPT_PARSER" IS

/* ************************************************************
  This is Intercept Parser

  Created By        : Basker Edwin
  Date Of Creation  : 04/14/16
  Version           : 01 - Edwin
                    : 02 , IM: 279, Edwin   /06/17/16

   **Resetting the version for 2018**

  Ver: 01           Resetting to version 01
  Ver: 02            MLT-3460

  *************************************************************   */

  procedure add_log_entry(p_log_text in varchar2);
  procedure main_proc(file_name in varchar2,
                       pl_chapter_id in varchar2);
  procedure process;
  procedure get_column(txtline in varchar2, delimit in char,strt in number,
  endc in number,outcol out varchar2);
  procedure read_delimiter;
  procedure parse_read_record;
  procedure init_variables;
  procedure rollback_and_exit ;

  temp_coll_date         DATE;
  field_delimiter        VARCHAR2(1);
  repeat_delimiter       VARCHAR2(1);
  logfile                UTL_FILE.FILE_TYPE;
  instfile               UTL_FILE.FILE_TYPE;
  LogDir                 VARCHAR2(100);
  logfilename            VARCHAR2(100);
  p_file_name            VARCHAR2(100);
  result_file_name       VARCHAR2(100);
  read_record            VARCHAR2(900);
  fetch_count            NUMBER:=0;
  complete               BOOLEAN:=false;
  process_date_time      VARCHAR2(25);
  v_unit_id              VARCHAR2(20);
  v_chapter_id           VARCHAR2(4);
  record_count           NUMBER:=0;
  upload_count           NUMBER:=0;
  err_msg                VARCHAR2(300);
  ncount                 NUMBER:=0;
  no_of_units            NUMBER:=0;
  g_local_time           DATE;
  p_chp_sys_date         DATE;

end LT_INTERCEPT_PARSER;

```
