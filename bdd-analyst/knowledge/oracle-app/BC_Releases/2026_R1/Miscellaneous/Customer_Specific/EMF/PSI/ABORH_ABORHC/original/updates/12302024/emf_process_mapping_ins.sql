REM INSERTING into EMF_PROCESS_MAPPING
SET DEFINE OFF;
insert into emf_process_mapping (
   mapping_name,
   data_column_name,
   data_table_name,
   where_clause,
   sql_stmt,
   program_id,
   insert_date,
   insert_user,
   audit_key,
   process_code
) values ( 'UNIT_CONTRACT_CHECK',
           null,
           null,
           null,
           'SELECT COUNT(1)
  FROM units u
 WHERE u.unit_id = :P_UNIT_ID
   AND u.coll_date = :P_COLL_DATE
   AND u.chapter_id = :P_CHAPTER_ID
   AND u.contract_id :P_OPER_CONTRACT_ID :P_VALUE_CONTRACT_ID',
           'VDIEMCFG',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           null,
           'ABORH' );

insert into emf_process_mapping (
   mapping_name,
   data_column_name,
   data_table_name,
   where_clause,
   sql_stmt,
   program_id,
   insert_date,
   insert_user,
   audit_key,
   process_code
) values ( 'UNIT_CONTRACT_CHECK',
           null,
           null,
           null,
           'SELECT COUNT(1)
  FROM units u
 WHERE u.unit_id = :P_UNIT_ID
   AND u.coll_date = :P_COLL_DATE
   AND u.chapter_id = :P_CHAPTER_ID
   AND u.contract_id :P_OPER_CONTRACT_ID :P_VALUE_CONTRACT_ID',
           'VDIEMCFG',
           to_date('26/12/24','DD/MM/RR'),
           'BCADMN',
           null,
           'ABORHC' );