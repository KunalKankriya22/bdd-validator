---
tags:
  - trigger
  - LTAPI
---
# API_INST_TEST_RESULTS_BD

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_INST_TEST_RESULTS|API_INST_TEST_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
declare
 l_user VARCHAR2(10);
begin
     select decode(substr(lt_user_session.get_userid, 1, 3), 'OPS', substr(lt_user_session.get_userid, 5), lt_user_session.get_userid)
     into l_user from dual ;

                begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'MACHINE_ID' ,
                                        :old.MACHINE_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'CHAPTER_ID' ,
                                        :old.CHAPTER_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'FILE_ID' ,
                                        :old.FILE_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'UNIT_ID' ,
                                        :old.UNIT_ID ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'COLL_DATE' ,
                                        :old.COLL_DATE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'MACHINE_TEST_ID' ,
                                        :old.MACHINE_TEST_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'MACHINE_RESULT' ,
                                        :old.MACHINE_RESULT ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_1' ,
                                        :old.TEST_ID_1 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_1' ,
                                        :old.RESULT_1 ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_2' ,
                                        :old.TEST_ID_2 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_2' ,
                                        :old.RESULT_2 ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_3' ,
                                        :old.TEST_ID_3 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_3' ,
                                        :old.RESULT_3 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_4' ,
                                        :old.TEST_ID_4 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_4' ,
                                        :old.RESULT_4 ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_5' ,
                                        :old.TEST_ID_5 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_5' ,
                                        :old.RESULT_5 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'TEST_ID_6' ,
                                        :old.TEST_ID_6 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_6' ,
                                        :old.RESULT_6 ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'LOWER_RESULT_RANGE' ,
                                        :old.LOWER_RESULT_RANGE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'UPPER_RESULT_RANGE' ,
                                        :old.UPPER_RESULT_RANGE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'WELL_NUMBER' ,
                                        :old.WELL_NUMBER ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'ABSORBANCE' ,
                                        :old.ABSORBANCE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RATIO' ,
                                        :old.RATIO ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'PLATE_ID' ,
                                        :old.PLATE_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_DATE' ,
                                        :old.RESULT_DATE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RESULT_USER_ID' ,
                                        :old.RESULT_USER_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'ERROR_CODE' ,
                                        :old.ERROR_CODE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RECORD_SEQUENCE' ,
                                        :old.RECORD_SEQUENCE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'PATIENT_LAST_NAME' ,
                                        :old.PATIENT_LAST_NAME ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'PATIENT_FIRST_NAME' ,
                                        :old.PATIENT_FIRST_NAME ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'PATIENT_DOB' ,
                                        :old.PATIENT_DOB ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'COMMENTS' ,
                                        :old.COMMENTS ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'SKIP_RECORD' ,
                                        :old.SKIP_RECORD ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'UPLOAD_STATUS' ,
                                        :old.UPLOAD_STATUS ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'INSERT_DATE' ,
                                        :old.INSERT_DATE ,
                                        NULL);
                end;


begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'INSERT_USER' ,
                                        :old.INSERT_USER ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'FINAL_POOL_SIZE' ,
                                        :old.FINAL_POOL_SIZE ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'EXT_BATCH_ID' ,
                                        :old.EXT_BATCH_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'SITE_ID' ,
                                        :old.SITE_ID ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'PARSED_BY' ,
                                        :old.PARSED_BY ,
                                        NULL);
                end;

begin
                                insert into API_INST_TEST_RESULTS_AUDIT (
                                        audit_key ,
                                        audit_insert_dats ,
                                        program_id ,
                                        user_id  ,
                                        action_code ,
                                        column_name ,
                                        old_value ,
                                        new_value)
                                values (
                                        :old.audit_key ,
                                        sysdate ,
                                        'DELETE' ,
                                        l_user ,
                                        'D',
                                        'RECORD_ID' ,
                                        :old.RECORD_ID ,
                                        NULL);
                end;



  end;
```
