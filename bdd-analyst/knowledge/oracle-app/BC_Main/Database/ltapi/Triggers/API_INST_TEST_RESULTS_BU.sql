--------------------------------------------------------
--  DDL for Trigger API_INST_TEST_RESULTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "API_INST_TEST_RESULTS_BU" 
before update
on API_INST_TEST_RESULTS
for each row
declare
 l_user VARCHAR2(10);
begin
     select decode(substr(lt_user_session.get_userid, 1, 3), 'OPS', substr(lt_user_session.get_userid, 5), lt_user_session.get_userid)
     into l_user from dual ;

        if nvl(:old.MACHINE_ID,'*') !=
           nvl(:new.MACHINE_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'MACHINE_ID' ,
                                        :old.MACHINE_ID ,
                                        :new.MACHINE_ID );
                end;

        end if;

	if nvl(:old.chapter_id,'*') !=
           nvl(:new.chapter_id,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'chapter_id' ,
                                        :old.chapter_id ,
                                        :new.chapter_id  );
                end;

        end if;

	if nvl(:old.FILE_ID,'*') !=
           nvl(:new.FILE_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'FILE_ID' ,
                                        :old.FILE_ID ,
                                        :new.FILE_ID  );
                end;

        end if;

        if nvl(:old.UNIT_ID,'*') !=
           nvl(:new.UNIT_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'UNIT_ID' ,
                                        :old.UNIT_ID ,
                                        :new.UNIT_ID  );
                end;

        end if;

	if nvl(:old.COLL_DATE,to_date('01-JAN-33')) !=
           nvl(:new.COLL_DATE,to_date('01-JAN-33'))
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'COLL_DATE' ,
                                        :old.COLL_DATE ,
                                        :new.COLL_DATE  );
                end;

        end if;

        if nvl(:old.MACHINE_TEST_ID,'*') !=
           nvl(:new.MACHINE_TEST_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'MACHINE_TEST_ID' ,
                                        :old.MACHINE_TEST_ID ,
                                        :new.MACHINE_TEST_ID  );
                end;

        end if;

	if nvl(:old.MACHINE_RESULT,'*') !=
           nvl(:new.MACHINE_RESULT,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'MACHINE_RESULT' ,
                                        :old.MACHINE_RESULT ,
                                        :new.MACHINE_RESULT  );
                end;

        end if;

	if nvl(:old.TEST_ID_1,'*') !=
           nvl(:new.TEST_ID_1,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_1' ,
                                        :old.TEST_ID_1 ,
                                        :new.TEST_ID_1  );
                end;

        end if;

	if nvl(:old.RESULT_1,'*') !=
           nvl(:new.RESULT_1,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_1' ,
                                        :old.RESULT_1 ,
                                        :new.RESULT_1  );
                end;

        end if;


	if nvl(:old.TEST_ID_2,'*') !=
           nvl(:new.TEST_ID_2,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_2' ,
                                        :old.TEST_ID_2 ,
                                        :new.TEST_ID_2  );
                end;

        end if;

	if nvl(:old.RESULT_2,'*') !=
           nvl(:new.RESULT_2,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_2' ,
                                        :old.RESULT_2 ,
                                        :new.RESULT_2  );
                end;

        end if;

	if nvl(:old.TEST_ID_3,'*') !=
           nvl(:new.TEST_ID_3,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_3' ,
                                        :old.TEST_ID_3 ,
                                        :new.TEST_ID_3  );
                end;

        end if;

	if nvl(:old.RESULT_3,'*') !=
           nvl(:new.RESULT_3,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_3' ,
                                        :old.RESULT_3 ,
                                        :new.RESULT_3  );
                end;

        end if;


	if nvl(:old.TEST_ID_4,'*') !=
           nvl(:new.TEST_ID_4,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_4' ,
                                        :old.TEST_ID_4 ,
                                        :new.TEST_ID_4  );
                end;

        end if;

	if nvl(:old.RESULT_4,'*') !=
           nvl(:new.RESULT_4,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_4' ,
                                        :old.RESULT_4 ,
                                        :new.RESULT_4  );
                end;

        end if;

	if nvl(:old.TEST_ID_5,'*') !=
           nvl(:new.TEST_ID_5,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_5' ,
                                        :old.TEST_ID_5 ,
                                        :new.TEST_ID_5  );
                end;

        end if;

	if nvl(:old.RESULT_5,'*') !=
           nvl(:new.RESULT_5,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_5' ,
                                        :old.RESULT_5 ,
                                        :new.RESULT_5  );
                end;

        end if;

	if nvl(:old.TEST_ID_6,'*') !=
           nvl(:new.TEST_ID_6,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'TEST_ID_6' ,
                                        :old.TEST_ID_6 ,
                                        :new.TEST_ID_6  );
                end;

        end if;

	if nvl(:old.RESULT_6,'*') !=
           nvl(:new.RESULT_6,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_6' ,
                                        :old.RESULT_6 ,
                                        :new.RESULT_6  );
                end;

        end if;


if nvl(:old.LOWER_RESULT_RANGE,'*') !=
           nvl(:new.LOWER_RESULT_RANGE,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'LOWER_RESULT_RANGE' ,
                                        :old.LOWER_RESULT_RANGE ,
                                        :new.LOWER_RESULT_RANGE  );
                end;

        end if;


if nvl(:old.UPPER_RESULT_RANGE,'*') !=
           nvl(:new.UPPER_RESULT_RANGE,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'UPPER_RESULT_RANGE' ,
                                        :old.UPPER_RESULT_RANGE ,
                                        :new.UPPER_RESULT_RANGE  );
                end;

        end if;


if nvl(:old.WELL_NUMBER,-1) !=
           nvl(:new.WELL_NUMBER,-1)
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'WELL_NUMBER' ,
                                        :old.WELL_NUMBER,
                                        :new.WELL_NUMBER );
                end;

        end if;


if nvl(:old.ABSORBANCE,'*') !=
           nvl(:new.ABSORBANCE,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'ABSORBANCE' ,
                                        :old.ABSORBANCE ,
                                        :new.ABSORBANCE  );
                end;

        end if;


if nvl(:old.RATIO,'*') !=
           nvl(:new.RATIO,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RATIO' ,
                                        :old.RATIO ,
                                        :new.RATIO  );
                end;

        end if;


if nvl(:old.PLATE_ID,'*') !=
           nvl(:new.PLATE_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'PLATE_ID' ,
                                        :old.PLATE_ID ,
                                        :new.PLATE_ID  );
                end;

        end if;


if nvl(:old.RESULT_DATE,to_date('01-JAN-33')) !=
           nvl(:new.RESULT_DATE,to_date('01-JAN-33'))
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_DATE' ,
                                        :old.RESULT_DATE ,
                                        :new.RESULT_DATE  );
                end;

        end if;


if nvl(:old.RESULT_USER_ID,'*') !=
           nvl(:new.RESULT_USER_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RESULT_USER_ID' ,
                                        :old.RESULT_USER_ID ,
                                        :new.RESULT_USER_ID  );
                end;

        end if;


if nvl(:old.ERROR_CODE,'*') !=
           nvl(:new.ERROR_CODE,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'ERROR_CODE' ,
                                        :old.ERROR_CODE ,
                                        :new.ERROR_CODE );
                end;

        end if;


if nvl(:old.RECORD_SEQUENCE,-1) !=
           nvl(:new.RECORD_SEQUENCE,-1)
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RECORD_SEQUENCE' ,
                                        :old.RECORD_SEQUENCE ,
                                        :new.RECORD_SEQUENCE  );
                end;

        end if;


if nvl(:old.PATIENT_LAST_NAME,'*') !=
           nvl(:new.PATIENT_LAST_NAME,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'PATIENT_LAST_NAME' ,
                                        :old.PATIENT_LAST_NAME ,
                                        :new.PATIENT_LAST_NAME );
                end;

        end if;


if nvl(:old.PATIENT_FIRST_NAME,'*') !=
           nvl(:new.PATIENT_FIRST_NAME,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'PATIENT_FIRST_NAME' ,
                                        :old.PATIENT_FIRST_NAME ,
                                        :new.PATIENT_FIRST_NAME );
                end;

        end if;

if nvl(:old.PATIENT_DOB,to_date('01-JAN-33')) !=
           nvl(:new.PATIENT_DOB,to_date('01-JAN-33'))
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'PATIENT_DOB' ,
                                        :old.PATIENT_DOB ,
                                        :new.PATIENT_DOB );
                end;

        end if;

if nvl(:old.COMMENTS,'*') !=
           nvl(:new.COMMENTS,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'COMMENTS' ,
                                        :old.COMMENTS ,
                                        :new.COMMENTS );
                end;

        end if;

if nvl(:old.SKIP_RECORD,'*') !=
           nvl(:new.SKIP_RECORD,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'SKIP_RECORD' ,
                                        :old.SKIP_RECORD ,
                                        :new.SKIP_RECORD );
                end;

        end if;

if nvl(:old.UPLOAD_STATUS,'*') !=
           nvl(:new.UPLOAD_STATUS,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'UPLOAD_STATUS' ,
                                        :old.UPLOAD_STATUS ,
                                        :new.UPLOAD_STATUS );
                end;

        end if;

if nvl(:old.INSERT_DATE,to_date('01-JAN-33')) !=
           nvl(:new.INSERT_DATE,to_date('01-JAN-33'))
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'INSERT_DATE' ,
                                        :old.INSERT_DATE ,
                                        :new.INSERT_DATE );
                end;

        end if;

if nvl(:old.INSERT_USER,'*') !=
           nvl(:new.INSERT_USER,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'INSERT_USER' ,
                                        :old.INSERT_USER ,
                                        :new.INSERT_USER );
                end;

        end if;

if nvl(:old.FINAL_POOL_SIZE,-1) !=
           nvl(:new.FINAL_POOL_SIZE,-1)
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'FINAL_POOL_SIZE' ,
                                        :old.FINAL_POOL_SIZE,
                                        :new.FINAL_POOL_SIZE );
                end;

        end if;

if nvl(:old.EXT_BATCH_ID,'*') !=
           nvl(:new.EXT_BATCH_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'EXT_BATCH_ID' ,
                                        :old.EXT_BATCH_ID ,
                                        :new.EXT_BATCH_ID );
                end;

        end if;

if nvl(:old.SITE_ID,'*') !=
           nvl(:new.SITE_ID,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'SITE_ID' ,
                                        :old.SITE_ID ,
                                        :new.SITE_ID );
                end;

        end if;

if nvl(:old.PARSED_BY,'*') !=
           nvl(:new.PARSED_BY,'*')
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'PARSED_BY' ,
                                        :old.PARSED_BY ,
                                        :new.PARSED_BY );
                end;

        end if;

if nvl(:old.RECORD_ID,-1) !=
           nvl(:new.RECORD_ID,-1)
        then
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
                                        'API' ,
                                        l_user,
                                        'U',
                                        'RECORD_ID' ,
                                        :old.RECORD_ID,
                                        :new.RECORD_ID );
                end;

        end if;


end;
/
ALTER TRIGGER "API_INST_TEST_RESULTS_BU" ENABLE;
