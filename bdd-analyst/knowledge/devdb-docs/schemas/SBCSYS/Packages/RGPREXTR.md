---
tags:
  - package
  - SBCSYS
---
# RGPREXTR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE RGPREXTR as
/* *********************************************************************************
  Name              : RGPREXTR.pkg
  Created By        : Kishore Gummadi
  Date Of Creation  : 06/16/2011
  Purpose           : Regional Test Center result extraction program.

  Version History (Change program version in code below)

  Date         Version   by     	Description
  ---------------------------------------------------------------------------------
  06/16/2011   01	Kishore		Initial development
  01/19/2012   02       Kishore		Fixed issues while testing
  04/24/2012   03       Kishore		Replaced "time_zone_enabled" table with "lt_application_config"
  05/31/2016   03	Seshu		Reverted back to CHAPTERS from CHAPTERS_LAB
  09/19/2019   04 Ashok VALID_INTERDICTIONS to VALID_INTERDICTIONS_LAB					
  LT_2018 version update:

  06/10/2017   01   Edwin    new version and 2018 changes
  11/15/2017   02   Edwin    Change the appl ID to DON
  06/29/2018   03   Ashok    Allow extract pkg to work from extract screen which can now pull units across multiple chapters.
                             -- search for V03 to track code changes.
  07/02/2018   04   Ashok    -- search for V04 (update output_file_name with log file name) 
  07/18/2018   05   Ashok    -- search for V05    
  02/15/2019   06   Ashok    -- Count display format is incorrect. Search for V06 for code changes. LT 2018R2 -- no MLT assigned.  
  03/04/2019   07   Ashok    -- MLT 1856    (search for V07)   
  09/05/2019   08   Ashok    -- MLT 2405    (search for V08)    (rgt_test_matrix and rgt_results_matrix tables are institutional now) 
  09/20/2019   09   Ashok    -- (search for V09) 'TR:' line print modified
  03/30/2020   10   Edwin    -- MLT 3007 , it was updating the parm ID of the test where the extract flag is set to N
  03/24/2020   11   Ashok    -- MLT 3007 , Update extract date for tests marked as not for extract only if the test results are in
  01/08/2021   12   Ashok    -- MLT 3923/3912, Applied trunc on u.coll_date in queries (STIN screen can add time portion to coll date) 
  03/28/2023   13   Ashok    -- MLT 5856 (EF file changes)
                             -- 1) use electronic_file_flag from contract_tests table to
                             -- determine if a test has to be in electronic file or not.
                             -- NULL OR Y -> include in EFile.
                             -- N -> do not include in EFile.
                             -- 2) Use non_profile_ef flag on contracts table to determine
                             -- if a non profile test has to be included in efile or not.
  04/06/2023   14   Ashok    -- Set extract date to tests with ef_flag set to N. Without extract date, RSM report does not show results
                             -- and batch id shows up in EXTRACT screen.
  04/10/2023   15   Ashok    -- Set extract date for non profile tests so that they show up on the RSM Report.
  04/17/2023   16   Ashok    -- Cursor c1 (got broken in V03 where chapter ID was added
                                to select stmt which resulted in order change)
                                Batch ID printing multiple times issue.
  04/17/2023   17   Ashok    -- UTB query updated to look at test_Chapter_id if chapter_id is NULL. -- MLT 5957
                             -- Remove lab file only if it was generatd (handle_error exception)
  04/20/2023   18   Ashok    -- Using a new variable t_efile_created to keep track of efile creation.     
  04/21/2023   19   Ashok    -- Holding_tests check added (MLT-5869)
  04/26/2023   20   Ashok    -- MLT-5979 : For abort scenario - Set unit count to 0 in rgt_result_parms table (used for generating RSM Report)
  04/27/2023   21   Ashok    -- MLT-5869 (check result_status_1 (or 2) and temp_result_1 (or 2) in holding tests check.
  05/02/2023   22   Ashok    -- MLT-5997 (Set abort_flag in rgt_result_parms table) --V22
***********************************************************************   */
  Procedure MAIN_PROGRAM(p_parm_id in varchar2,
                         p_chapter_id in varchar2,
                         p_contract_id in varchar2,
                         p_pp_id in varchar2,
                         p_status out varchar2);
END RGPREXTR;



```
