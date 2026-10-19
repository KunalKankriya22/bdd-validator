---
tags:
  - package
  - SBCSYS
---
# ATUPSURD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATUPSURD" AS

/*****************************************************************************
Developed By : Basker Edwin
Create Date  : 03.15.2008
Purpose      : This procedure will cconvert the surround file format to the
               LifeTrak format. A intermediate table RTURLOAD_INTERFACE is used.
               The data is populated in the table forst then converted into the
               file
Date Mod     :03.17.2008
Version      :01
Version      :02 Unit ID conversion and result code translation -08/10/08 Edwin
Version      :03 Modify the code to read from a temp table instead of a file  -04/22/11 ISSA
                  Add LOAD_SURROUND_from_table procedure

Version      :04  append the file_id to the output file name

version      :05   Add the file id to szRunID.

version      :06   Fix error when file has a blank record.

version      :07  getting chapter id as input
**************************************************************************** */
   procedure add_log_entry(p_log_text in varchar2);
   procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                        pl_chapter_id in varchar2);
   procedure rollback_and_exit;
   procedure convert_unit(pl_in_unit in  varchar2,pl_out_unit out varchar2);
   procedure result_translation(pl_surnd_test_id in varchar2,
                                pl_surnd_res in varchar2,
                                pl_lt_res out varchar2);
   PROCEDURE GEN_RTURLOAD_FILE (pl_run_id in varchar2);
   PROCEDURE LOAD_SURROUND_TO_TEMP(pl_run_id in varchar2);
   PROCEDURE LOAD_SURROUND_from_table(x_file_id varchar2,pl_run_id in varchar2);
   FUNCTION gen_parmid return varchar2;

   complete               BOOLEAN:=false;
   logfile                UTL_FILE.FILE_TYPE;
   instfile               UTL_FILE.FILE_TYPE;
   outfile                UTL_FILE.FILE_TYPE;
   read_record            VARCHAR2(500);
   szRunID                VARCHAR2(500);
   v_machine_id           VARCHAR2(10);
   P_FILE_NAME            VARCHAR2(500);
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
   v_filesource varchar2(1);

END ATUPSURD;

```
