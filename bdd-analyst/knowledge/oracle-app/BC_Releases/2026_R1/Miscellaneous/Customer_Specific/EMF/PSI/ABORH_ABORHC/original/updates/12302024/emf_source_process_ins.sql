insert into emf_source_process (
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
   audit_key,
   param_flag,
   sql_out
) values ( 'ABORH',
           null,
           6,
           'UNIT_CONTRACT_CHECK',
           null,
           null,
           null,
           null,
           'SELECT COUNT(1)
  FROM units u
 WHERE u.unit_id = :P_UNIT_ID
   AND u.coll_date = :P_COLL_DATE
   AND u.chapter_id = :P_CHAPTER_ID
   AND u.contract_id IN ( SELECT REGEXP_SUBSTR(''MCGIM0023,MCGIM0022'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''MCGIM0023,MCGIM0022'', ''[^,]+'', 1, LEVEL) IS NOT NULL)',
           'VEMFPROC',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           NULL,
           'Y',
           null );

insert into emf_source_process (
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
   audit_key,
   param_flag,
   sql_out
) values ( 'ABORH',
           null,
           6.01,
           null,
           'units',
           'contract_id',
           'IN',
           'MCGIM0023,MCGIM0022',
           null,
           'VEMFPROC',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           NULL,
           null,
           null );

insert into emf_source_process (
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
   audit_key,
   param_flag,
   sql_out
) values ( 'ABORHC',
           null,
           6,
           'UNIT_CONTRACT_CHECK',
           null,
           null,
           null,
           null,
           'SELECT COUNT(1)
  FROM units u
 WHERE u.unit_id = :P_UNIT_ID
   AND u.coll_date = :P_COLL_DATE
   AND u.chapter_id = :P_CHAPTER_ID
   AND u.contract_id IN ( SELECT REGEXP_SUBSTR(''MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021'', ''[^,]+'', 1, LEVEL) IS NOT NULL)'
           ,
           'VEMFPROC',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           NULL,
           'Y',
           null );
           
insert into emf_source_process (
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
   audit_key,
   param_flag,
   sql_out
) values ( 'ABORHC',
           null,
           6.01,
           null,
           'units',
           'contract_id',
           'IN',
           'MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021'
           ,
           null,
           'VEMFPROC',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           NULL,
           null,
           null );