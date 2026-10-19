---
tags:
  - package
  - SBCSYS
---
# LAB_COMMON

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lab_common AS

/*****************************************************************************
-----------------------------------------------------------------------------
Ver |   Date Mod.   |   Changes
-----------------------------------------------------------------------------
01  |   04/17/2009  |   Initial Version. This package would contaIN the common 
                        functions that are used IN the LT Lab applications
02  |   08/10/2011  |   Added new PROCEDURE POP_USER_ERROR_LOG to populate
                        data INTO USER_ERROR_LOG table
03  |   08/25/2011  |   Added new PROCEDURE update_dst to synchronize
                        lab time_zone on chapters table with donOR side
04  |   09/20/2011  |   Added sequence to exIStINg column file_name, so as to 
                        enable retention of lINe ORder of the file IN repORt 
                        gerlogrep.rdf
05  |   10/04/2012  |   Added new procedure CHECK_COLL_DATE. IM 9156
06  |   06/29/2015  |   Added a function to determine the status of the debug 
                        message flag
07  |   09/10/2015  |   Creating a batch ID
08  |   04/29/2016  |   Routine to populate the PATHOGEN_STERILE_DOCKING
                        SCR: 372878
09  |   05/10/2016  |   Routine to populate the component_interdictions
                        SCR: 372878
10  |   05/10/2016  |   Changes to Pathogen Sterile Docking
                        SCR: 372878
11  |   05/23/2016  |   Routine to delete from pathogen sterile docking.
                        SCR: 372878
12  |   05/23/2016  |   product code added to delete statements.
                        SCR: 372878
13  |   07/01/2016  |   Renamed below tables for merging database work
                        CHAPTERS@DONOR	as	CHAPTERS
                        CHAPTERS	as	CHAPTERS_LAB in update_dst  procedure
                        (LT2017 DB Merge Work)
13  |   08/02/2016  |   Renamed below tables for merging database work
                        CHAPTERS_DON	as	CHAPTERS
                        (LT2017 DB Merge Work)
13  |   05/29/2018  |   Created new function CHECK_CONTRACT_CHAPTER to 
                        validate Contract id aganist Chapter id.
                        MLT-253
------------------------------------------------------------------------------
version reset
------------------------------------------------------------------------------
02  |   07/02/2018  |   pop_extract_log_table (new function added for 
                        RSM Report). Used in RMUSER to view log report.
                        MLT-439
03  |   07/24/2018  |   CHECK_CONTRACT_CHAPTER (INTERNAL contract scenario 
                        added)
                        MLT-522
04  |   07/31/2018  |   gen_batch_id routine modified to add LPAD to batch_seq
                        MLT-583
05  |   11/09/2018  |   -----------------
06  |   09/07/2019  |   POP_LOG_TABLE, POP_EXTRACT_LOG_TABLE routines modfied to
                        add line_no to log tables
                        MLT-2479
07  |   01/09/2020  |   MLT-2875		
08  |   08/23/2022  |   DELETE_STERILE_DOCKING table updated. Added parameter 
                        pl_SUIT_PROD_CODE
                        MLT-5410, MLT-5424
09  |   04/13/2023  |   MLT-5880   get_batch_colldate,  get_skip_code                  
**************************************************************************** */

    PROCEDURE pop_log_table (
        pl_rep_name IN VARCHAR2,
        pl_parm_id  IN VARCHAR2,
        pl_dir      IN VARCHAR2,
        pl_file     IN VARCHAR2,
        pl_stat     OUT VARCHAR2
    );

-- 07/02/2018 (Used in RMUSER)
    PROCEDURE pop_extract_log_table (
        pl_sess_id IN VARCHAR2,
        pl_parm_id IN VARCHAR2,
        pl_dir     IN VARCHAR2,
        pl_file    IN VARCHAR2,
        pl_stat    OUT VARCHAR2
    );

	-- Added by Kishore on 08/10/2011. SCR 18564
    PROCEDURE pop_user_error_log (
        pl_insert_dats      IN DATE,
        pl_user_id          IN VARCHAR2,
        pl_program_name     IN VARCHAR2,
        pl_error_code       IN VARCHAR2,
        pl_unit_id          IN VARCHAR2,
        pl_coll_date        IN DATE,
        pl_chapter_id       IN VARCHAR2,
        pl_component_prefix IN VARCHAR2,
        pl_product_code     IN VARCHAR2,
        pl_status           OUT VARCHAR2
    );

	-- added by hussein on 08-25-2011.
    PROCEDURE update_dst;

        -- Added by Kishore on 10/04/2012. IM 9156
    PROCEDURE check_coll_date (
        pl_unit_id       IN VARCHAR2,
        pl_coll_date     IN DATE,
        pl_compared_date IN DATE,
        pl_error_flag    OUT VARCHAR2
    );

        -- Added by Kishore on 06/29/2015
    FUNCTION is_debug_msg_displayed (
        p_obj_name IN VARCHAR2,
        p_obj_type IN VARCHAR2
    ) RETURN BOOLEAN;

    PROCEDURE gen_batch_id (
        pl_batch_prefix IN VARCHAR2,
        pl_chapter_id   IN VARCHAR2,
        pl_batch_id     OUT VARCHAR2,
        pl_status       OUT VARCHAR2
    );

-- Added By Edwin for 2015 R2 (Pathogen Reduction process)

    PROCEDURE insert_sterile_docking (
        pl_unit_id        IN VARCHAR2,
        pl_chapter_id     IN VARCHAR2,
        pl_weld_machine   IN VARCHAR2,
        pl_wafer_lot_no   IN VARCHAR2,
        pl_weld_ok        IN VARCHAR2,
        pl_proc_code      IN VARCHAR2,
        pl_set_lot_no     IN VARCHAR2,
        pl_vol_type_set   IN VARCHAR2,
        pl_insert_user    IN VARCHAR2,
        pl_program_id     IN VARCHAR2,
        pl_suit_prod_code IN VARCHAR2,
        pl_status         OUT VARCHAR2
    );

    PROCEDURE place_component_inter (
        pl_unit_id    IN VARCHAR2,
        pl_coll_date  IN DATE,
        pl_chp_id     IN VARCHAR2,
        pl_prod_code  IN VARCHAR2,
        pl_inter_code IN VARCHAR2,
        pl_inter_user IN VARCHAR2,
        pl_audit_key  IN NUMBER,
        pl_pgm_id     IN VARCHAR2,
        pl_status     OUT VARCHAR2
    );

    PROCEDURE delete_sterile_docking (
        pl_unit_id        IN VARCHAR2,
        pl_proc_code      IN VARCHAR2,
        pl_suit_prod_code IN VARCHAR2,
        pl_status         OUT VARCHAR2
    );

    FUNCTION check_contract_chapter (
        p_contract_id IN VARCHAR2,
        p_chapter_id  IN VARCHAR2
    ) RETURN VARCHAR2;

    PROCEDURE confirmatory_qc_lock (
        p_session_id   IN VARCHAR2,
        p_lock_level   IN VARCHAR2,
        p_lock_value   IN VARCHAR2,
        p_lock_user    IN VARCHAR2,
        p_lock_flag_lu IN VARCHAR2,
        p_status       OUT VARCHAR2
    );

    FUNCTION number_of_same_containers (
        pl_catalog_number IN VARCHAR2
    ) RETURN NUMBER;

    FUNCTION get_skip_code (
        unit_id_in    IN VARCHAR2,
        chapter_id_in IN VARCHAR2,
        coll_date_in  IN DATE
    ) RETURN VARCHAR2;

    FUNCTION get_batch_colldate (
        batch_id_in   IN VARCHAR2,
        chapter_id_in IN VARCHAR2
    ) RETURN DATE;   

END lab_common;

```
