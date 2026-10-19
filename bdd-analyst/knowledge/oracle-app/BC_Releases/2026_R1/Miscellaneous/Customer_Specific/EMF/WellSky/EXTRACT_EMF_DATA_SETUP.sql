SELECT
    proc_code,
    proc_desc,
    eff_date,
    term_date,
    program_id,
    insert_date,
    'BCADMN' AS insert_user
FROM
    valid_emf_proc_def
WHERE
    proc_code = 'PLTNUM';

SELECT
    mapping_name,
    data_column_name,
    data_table_name,
    where_clause,
    sql_stmt,
    program_id,
    insert_date,
    'BCADMN' AS insert_user,
    process_code
FROM
    emf_process_mapping
WHERE
    process_code = 'PLTNUM';

SELECT
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
    'BCADMN' AS insert_user
FROM
    emf_parm_def
WHERE
    proc_code = 'PLTNUM';

SELECT
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
    'BCADMN' AS insert_user,
    param_flag,
    sql_out
FROM
    emf_source_process
WHERE
    process_code = 'PLTNUM';

SELECT
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
    'BCADMN' AS insert_user,
    parent_action_seq,
    alt_process_order
FROM
    emf_target_process
WHERE
    process_code = 'PLTNUM';