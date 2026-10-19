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
    'PLTNUM',
    'Action:
Place CMDH component interdiction

Criteria:
If a PLT product type is defined on a unit that also has an RPLT product type defined
',
    TO_DATE('07-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDIMPROC',
    TO_DATE('08-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
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
    'MUL_PLT_PROD_TYPES_ON_UNIT',
    NULL,
    NULL,
    NULL,
    'select count(1)
  from (
	select count(distinct(vp.product_type))
	  from units u,
	       components c,
	       valid_products vp
	 where u.coll_date = c.coll_date
	   and u.chapter_id = c.chapter_id
	   and u.unit_id = c.unit_id
	   and vp.product_code = substr(c.product_code,1,5)
        AND c.unit_id = :P_UNIT_ID
	   and vp.PRODUCT_TYPE :P_OPER_PRODUCT_TYPE :P_VALUE_PRODUCT_TYPE
	having count(distinct(vp.product_type)) = 2)',
    'VDIEMCFG',
    TO_DATE('08-OCT-24 03.52.18', 'DD-MON-RR HH24.MI.SS'),
    'BCADMN',
    'PLTNUM'
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
    'PLTNUM',
    1,
    'P_UNIT_ID',
    'CHAR',
    'IN',
    NULL,
    'COMPONENTS',
    'UNIT_ID',
    'MANUAL',
    TO_DATE('08-OCT-24 03.54.25', 'DD-MON-RR HH24.MI.SS'),
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
    'PLTNUM',
    NULL,
    1,
    'MUL_PLT_PROD_TYPES_ON_UNIT',
    NULL,
    NULL,
    NULL,
    NULL,
    'select count(1)
  from (
	select count(distinct(vp.product_type))
	  from units u,
	       components c,
	       valid_products vp
	 where u.coll_date = c.coll_date
	   and u.chapter_id = c.chapter_id
	   and u.unit_id = c.unit_id
	   and vp.product_code = substr(c.product_code,1,5)
        AND c.unit_id = :P_UNIT_ID
	   and vp.PRODUCT_TYPE IN ( SELECT REGEXP_SUBSTR(''PLT,RPLT'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''PLT,RPLT'', ''[^,]+'', 1, LEVEL) IS NOT NULL)
	having count(distinct(vp.product_type)) = 2)',
    'VEMFPROC',
    TO_DATE('08-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
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
    'PLTNUM',
    NULL,
    1.01,
    NULL,
    'valid_products',
    'product_type',
    'IN',
    'PLT,RPLT',
    NULL,
    'VEMFPROC',
    TO_DATE('08-OCT-24 00.00.00', 'DD-MON-RR HH24.MI.SS'),
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
    'PLTNUM',
    NULL,
    'A01',
    'PLACE',
    'INTER_CODE',
    'CMDH',
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