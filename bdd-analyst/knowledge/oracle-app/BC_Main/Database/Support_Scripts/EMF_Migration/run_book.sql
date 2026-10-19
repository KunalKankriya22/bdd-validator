-- 10/20/2025
-- MLT-8184
-- BCH EMF migration run scripts.
-- Extracted from BCH_Test to BCH_Prod on 10/20/2025
ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS';

@validate_script_structure.sql

/* For extraction of EMF Process related data */

SPOOL HLAUDUFFP.sql
DEFINE p_process_code = 'HLAUDUFFP'
@oracle_dynamic_extraction_script.sql
SPOOL OFF

SPOOL HLAPDUFFP.sql
DEFINE p_process_code = 'HLAPDUFFP'
@oracle_dynamic_extraction_script.sql
SPOOL OFF

SPOOL TRALISCH.sql
DEFINE p_process_code = 'TRALISCH'
@oracle_dynamic_extraction_script.sql
SPOOL OFF

SPOOL TRALIPL.sql
DEFINE p_process_code = 'TRALIPL'
@oracle_dynamic_extraction_script.sql
SPOOL OFF

SPOOL TRALI.sql
DEFINE p_process_code = 'TRALI'
@oracle_dynamic_extraction_script.sql
SPOOL OFF

/* For import of data */
@HLAPDUFFP.sql
@HLAUDUFFP.sql
@TRALIPL.sql
@TRALISCH.sql
