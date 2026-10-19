/*
    EMF setup for ABORH and ABORHC processes
    Client: PSI
    Date: 12/30/2024
    Description: Below script installs original configuration and updates ABORH and ABORHC EMF Configuration.

    original folder - has original configuration scripts.
    updates/12302024 folder - has updated configuration scripts from 12/30/2024.
*/
SET DEFINE OFF;

REM Description: This script will remove the ABORH and ABORHC EMF Configuration.
@\original\delete_process.sql

REM Description: This script will insert the EMF Configuration for ABORH and ABORHC.
@\original\EMF_PARM_DEF_ins.sql
@\original\EMF_PROCESS_MAPPING_ins.sql
@\original\EMF_SOURCE_PROCESS_ins.sql
@\original\EMF_TARGET_PROCESS_ins.sql
@\original\VALID_EMF_PROC_DEF_ins.sql

-- 12/30/2024
-- changes to not overlap ABORH and ABORHC emf.
@\updates\12302024\emf_process_mapping_ins.sql
@\updates\12302024\emf_source_process_ins.sql
@\updates\12302024\emf_target_process_upd.sql
