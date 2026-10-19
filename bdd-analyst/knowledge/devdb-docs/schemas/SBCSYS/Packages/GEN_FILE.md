---
tags:
  - package
  - SBCSYS
---
# GEN_FILE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "GEN_FILE" AS

/*****************************************************************************
Developed By : ISSA KARMI
Create Date  : 05.05.2011
Purpose      : This procedure will a file by reading the records from table
Date Mod     :
Version      :01

**************************************************************************** */
   procedure add_log_entry(p_log_text in varchar2);
   PROCEDURE get_file_name(v_inst_id in varchar2);
   procedure main_proc(file_name in varchar2,v_inst_id in varchar2);
   procedure rollback_and_exit;


   PROCEDURE LOAD_SURROUND_from_table(p_file_name varchar2,pl_run_id in varchar2);


   complete               BOOLEAN:=false;
   logfile                UTL_FILE.FILE_TYPE;
   instfile               UTL_FILE.FILE_TYPE;
   outfile                UTL_FILE.FILE_TYPE;
   read_record            VARCHAR2(500);
   szRunID                VARCHAR2(30);
   v_machine_id           VARCHAR2(10);
   P_FILE_NAME            VARCHAR2(100);
   result_file_name       VARCHAR2(100);
   szRTUFile              VARCHAR2(50);
   logfilename            VARCHAR2(100);
   szUnitID              VARCHAR2(50);
   eExcept                EXCEPTION;
   szBatchHdr             VARCHAR2(250);
   szHeader               VARCHAR2(250);
   nRowCount              NUMBER:=0;
   szChapter              VARCHAR2(50);
   szStatus               VARCHAR2(20);
   szContract             VARCHAR2(10);
   szBTString             VARCHAR2(20);
   szFTString             VARCHAR2(20);
   rowcount               NUMBER:=0;
   szTestID               VARCHAR2(300);
   codabar_unit_scheme    VARCHAR2(1);
   szUnit_ID              VARCHAR2(50);
   szResParm              VARCHAR2(10);
   szARCPrefix            VARCHAR2(10);
   szAlphaConvReq         VARCHAR2(3);
   v_chapter_id           VARCHAR2(5);

END gen_file;

```
