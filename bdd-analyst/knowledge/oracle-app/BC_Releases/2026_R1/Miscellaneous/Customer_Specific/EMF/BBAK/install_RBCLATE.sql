REM INSERTING into VALID_EMF_PROC_DEF
SET DEFINE OFF;

INSERT INTO valid_emf_proc_def (
    proc_code,
    proc_desc,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user
) VALUES (
    'RBCLATE',
    'Action:
Place FILT component interdiction.

Criteria:
If a E0336 is defined (COMPENTI/CPICOM2) > 3 days from the first separation time
',
    TO_DATE('07-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDIMPROC',
    TO_DATE('07-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN'
);

REM INSERTING into EMF_PROCESS_MAPPING
SET DEFINE OFF;

INSERT INTO emf_process_mapping (
    mapping_name,
    data_column_name,
    data_table_name,
    where_clause,
    sql_stmt,
    program_id,
    insert_date,
    insert_user,
    process_code
) VALUES (
    'PROD_BEYOND_SEP_TIME_BY_3DAYS',
    NULL,
    NULL,
    NULL,
    'SELECT COUNT(1)
FROM units u, components c 
WHERE u.first_sep_time IS NOT NULL 
and U.COLL_DATE = C.COLL_DATE
and u.chapter_id = c.chapter_id
and u.unit_id = c.unit_id
AND c.unit_id = :P_UNIT_ID
AND c.chapter_id = :P_CHAPTER_ID
AND c.coll_date = :P_COLL_DATE
AND c.product_code = :P_PRODUCT_CODE
and c.product_code :P_OPER_PROD_CODE :P_VALUE_PROD_CODE
and u.first_sep_time is not null
and (c.insert_dats - u.first_sep_time) > 3',
    'VDIEMCFG',
    TO_DATE('08-OCT-24 00.02.15', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN',
    'RBCLATE'
);

REM INSERTING into EMF_PARM_DEF
SET DEFINE OFF;

INSERT INTO emf_parm_def (
    proc_code,
    parm_no,
    parm_code,
    parm_type,
    parm_inout,
    default_value,
    ref_table,
    ref_column,
    program_id,
    insert_date,
    insert_user
) VALUES (
    'RBCLATE',
    1,
    'P_UNIT_ID',
    'CHAR',
    'IN',
    NULL,
    'COMPONENTS',
    'UNIT_ID',
    'MANUAL',
    TO_DATE('08-OCT-24 00.03.08', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN'
);

INSERT INTO emf_parm_def (
    proc_code,
    parm_no,
    parm_code,
    parm_type,
    parm_inout,
    default_value,
    ref_table,
    ref_column,
    program_id,
    insert_date,
    insert_user
) VALUES (
    'RBCLATE',
    2,
    'P_CHAPTER_ID',
    'CHAR',
    'IN',
    NULL,
    'COMPONENTS',
    'CHAPTER_ID',
    'MANUAL',
    TO_DATE('08-OCT-24 00.03.08', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN'
);

INSERT INTO emf_parm_def (
    proc_code,
    parm_no,
    parm_code,
    parm_type,
    parm_inout,
    default_value,
    ref_table,
    ref_column,
    program_id,
    insert_date,
    insert_user
) VALUES (
    'RBCLATE',
    3,
    'P_COLL_DATE',
    'DATE',
    'IN',
    NULL,
    'COMPONENTS',
    'COLL_DATE',
    'MANUAL',
    TO_DATE('08-OCT-24 00.03.08', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN'
);

INSERT INTO emf_parm_def (
    proc_code,
    parm_no,
    parm_code,
    parm_type,
    parm_inout,
    default_value,
    ref_table,
    ref_column,
    program_id,
    insert_date,
    insert_user
) VALUES (
    'RBCLATE',
    4,
    'P_PRODUCT_CODE',
    'CHAR',
    'IN',
    NULL,
    'COMPONENTS',
    'PRODUCT_CODE',
    'MANUAL',
    TO_DATE('08-OCT-24 00.03.08', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN'
);

REM INSERTING into EMF_SOURCE_PROCESS
SET DEFINE OFF;

INSERT INTO emf_source_process (
    process_code,
    process_at,
    process_seq,
    looking_for,
    data_table_name,
    data_column_name,
    sql_oper,
    response,
    sql_stmt,
    program_id,
    insert_date,
    insert_user,
    param_flag,
    sql_out
) VALUES (
    'BDLATE',
    NULL,
    1,
    'RESULT_BEYOND_36HRS',
    NULL,
    NULL,
    NULL,
    NULL,
    'select count(1)
  from (
	select ( max(ut.result_dats) - MAX(u.BLEED_START_TIME) ) * 24 as hrs
	  from utrs ut, units u
	 where ut.unit_id = :P_UNIT_ID
       and ut.chapter_id = :P_CHAPTER_ID
       and ut.coll_date = :P_COLL_DATE
	   and ut.test_id = ''BD''
       and ut.result_status_1 IS NOT NULL
       and ut.cancel_flag IS NULL
       and ut.result_dats is not null
       and ut.unit_id = u.UNIT_ID
       and ut.coll_date = u.COLL_DATE
       and ut.CHAPTER_ID = u.CHAPTER_ID
       and ut.result_dats is not NULL
       and u.bleed_start_time is not null       
)
 where hrs > 36',
    'VEMFPROC',
    TO_DATE('07-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN',
    'Y',
    NULL
);

INSERT INTO emf_source_process (
    process_code,
    process_at,
    process_seq,
    looking_for,
    data_table_name,
    data_column_name,
    sql_oper,
    response,
    sql_stmt,
    program_id,
    insert_date,
    insert_user,
    param_flag,
    sql_out
) VALUES (
    'BDLATE',
    NULL,
    1.01,
    NULL,
    'utrs',
    'test_id',
    'EQ',
    'BD',
    NULL,
    'VEMFPROC',
    TO_DATE('07-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN',
    NULL,
    NULL
);

REM INSERTING into EMF_TARGET_PROCESS
SET DEFINE OFF;

INSERT INTO emf_target_process (
    process_code,
    process_at,
    action_seq,
    action_code,
    action_on,
    action_value,
    data_table_name,
    data_column_name,
    sql_oper,
    response,
    process_order,
    action_fncs,
    program_id,
    insert_date,
    insert_user,
    parent_action_seq,
    alt_process_order
) VALUES (
    'RBCLATE',
    NULL,
    'A01',
    'PLACE',
    'INTER_CODE',
    'FILT',
    'COMPONENT_INTERDICTIONS',
    'INTER_CODE',
    NULL,
    NULL,
    '1',
    'CPICOM2',
    'VEMFPROC',
    TO_DATE('08-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN',
    NULL,
    NULL
);