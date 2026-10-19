--------------------------------------------------------
--  DDL for Trigger DONORS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONORS_BD" 
before delete
on DONORS
for each row
begin
        --
                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'donor_id' ,
                                        :old.donor_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'chapter_id' ,
                                        :old.chapter_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'gender' ,
                                        :old.gender ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'date_of_birth' ,
                                        :old.date_of_birth ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'last_name' ,
                                        :old.last_name ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'ssn' ,
                                        :old.ssn ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'last_name_suffix' ,
                                        :old.last_name_suffix ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'first_name' ,
                                        :old.first_name ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'middle_name' ,
                                        :old.middle_name ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'salutation' ,
                                        :old.salutation ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'blood_type' ,
                                        :old.blood_type ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'employer_id' ,
                                        :old.employer_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'title' ,
                                        :old.title ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'ethnic_group' ,
                                        :old.ethnic_group ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'status' ,
                                        :old.status ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'soundex_key' ,
                                        :old.soundex_key ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'previos_donor_id' ,
                                        :old.previos_donor_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'alias' ,
                                        :old.alias ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'claimed_donation' ,
                                        :old.claimed_donation ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'alternate_id' ,
                                        :old.alternate_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_unit' ,
                                        :old.migrated_unit ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_addr1' ,
                                        :old.migrated_addr1 ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_addr2' ,
                                        :old.migrated_addr2 ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_addr3' ,
                                        :old.migrated_addr3 ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_zip' ,
                                        :old.migrated_zip ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_status' ,
                                        :old.migrated_status ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'migrated_city' ,
                                        :old.migrated_city ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'lang' ,
                                        :old.lang ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'note_id' ,
                                        :old.note_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'conv_donor_id' ,
                                        :old.conv_donor_id ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'prev_blood_center' ,
                                        :old.prev_blood_center ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'insert_date' ,
                                        :old.insert_date ,
                                        NULL);
                end;

                begin
                                insert into DONORS_AUDIT (
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
                                        substr(lt_user_session.get_userid,1,6) ,
                                        'D',
                                        'insert_user' ,
                                        :old.insert_user ,
                                        NULL);
                end;

        --
end;
/
ALTER TRIGGER "DONORS_BD" ENABLE;
