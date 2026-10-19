
Spool API_Tables_Triggers.log

--Connect LTAPI/ltapi

Create Table LTAPI.API_INST_TEST_RESULTS
(
MACHINE_ID           VARCHAR2(5)   NOT NULL,
CHAPTER_ID           VARCHAR2(4)   NOT NULL,
FILE_ID               VARCHAR2(50) NOT NULL,
UNIT_ID              VARCHAR2(16)  NOT NULL,
COLL_DATE            DATE,
MACHINE_TEST_ID      VARCHAR2(10)  NOT NULL,
MACHINE_RESULT       VARCHAR2(30)  NOT NULL,
LOWER_RESULT_RANGE   VARCHAR2(30),
UPPER_RESULT_RANGE   VARCHAR2(30),
WELL_NUMBER          NUMBER,
ABSORBANCE           VARCHAR2(12),
RATIO                VARCHAR2(17),
PLATE_ID             VARCHAR2(40),
RESULT_DATE          DATE,
RESULT_USER_ID       VARCHAR2(30),
ERROR_CODE           VARCHAR2(10),
RECORD_SEQUENCE      NUMBER,
PATIENT_LAST_NAME    VARCHAR2(50),
PATIENT_FIRST_NAME   VARCHAR2(50),
PATIENT_DOB          DATE,
COMMENTS             VARCHAR2(300),
SKIP_RECORD          VARCHAR2(1)   NOT NULL,
UPLOAD_STATUS        VARCHAR2(1)   NOT NULL,
INSERT_DATE          DATE          NOT NULL,
INSERT_USER          VARCHAR2(30)  NOT NULL,
AUDIT_KEY            NUMBER        NOT NULL
);

Create Or Replace Public Synonym API_INST_TEST_RESULTS for LTAPI.API_INST_TEST_RESULTS;

Grant Select,insert,update,delete on LTAPI.API_INST_TEST_RESULTS to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;


Create Table LTAPI.API_INST_TEST_RESULTS_AUDIT
(
AUDIT_KEY         NUMBER(38)	NOT NULL,
AUDIT_INSERT_DATS DATE		NOT NULL,
PROGRAM_ID        VARCHAR2(30)	NOT NULL,
USER_ID           VARCHAR2(6)	NOT NULL,
ACTION_CODE       VARCHAR2(1)	NOT NULL,
COLUMN_NAME       VARCHAR2(50)	NOT NULL,
OLD_VALUE         VARCHAR2(240),
NEW_VALUE         VARCHAR2(240)
);

Create Or Replace Public Synonym API_INST_TEST_RESULTS_AUDIT for LTAPI.API_INST_TEST_RESULTS_AUDIT;

Grant Select,insert,update,delete on LTAPI.API_INST_TEST_RESULTS_AUDIT to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;


Create Table LTAPI.API_INST_ERROR_HANDLING
(
MACHINE_ID           VARCHAR2(5),
CHAPTER_ID           VARCHAR2(4),
ERROR_CODE           VARCHAR2(10),
ERROR_DESC           VARCHAR2(250),
SKIP_LEVEL           VARCHAR2(1),
EFF_DATE             DATE   NOT NULL,
TERM_DATE            DATE,
INSERT_DATE          DATE,
INSERT_USER          VARCHAR2(30),
AUDIT_KEY            NUMBER,
TEST_ID		     VARCHAR2(10),
PROGRAM_ID		VARCHAR2(30)
);

Create Or Replace Public Synonym API_INST_ERROR_HANDLING for LTAPI.API_INST_ERROR_HANDLING;

Grant Select,insert,update,delete on LTAPI.API_INST_ERROR_HANDLING to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;


Create Table LTAPI.API_INST_ERROR_HANDLING_AUDIT
(
AUDIT_KEY	NUMBER(38)	NOT NULL,
AUDIT_INSERT_DATS DATE		NOT NULL,
PROGRAM_ID	VARCHAR2(30)	NOT NULL,
USER_ID		VARCHAR2(6)	NOT NULL,
ACTION_CODE	VARCHAR2(1)	NOT NULL,
COLUMN_NAME	VARCHAR2(50)	NOT NULL,
OLD_VALUE	VARCHAR2(240),
NEW_VALUE	VARCHAR2(240)
);

Create Or Replace Public Synonym API_INST_ERROR_HANDLING_AUDIT for LTAPI.API_INST_ERROR_HANDLING_AUDIT;

Grant Select,insert,update,delete on LTAPI.API_INST_ERROR_HANDLING_AUDIT to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;


Create Table LTAPI.API_INST_TEST_RESULTS_ARC
(
MACHINE_ID		VARCHAR2(5)	NOT NULL,
CHAPTER_ID		VARCHAR2(4)	NOT NULL,
FILE_ID			VARCHAR2(50)	NOT NULL,
UNIT_ID			VARCHAR2(16)	NOT NULL,
COLL_DATE		DATE,
MACHINE_TEST_ID		VARCHAR2(10)	NOT NULL,
MACHINE_RESULT		VARCHAR2(30)	NOT NULL,
LOWER_RESULT_RANGE	VARCHAR2(30),
UPPER_RESULT_RANGE	VARCHAR2(30),
WELL_NUMBER		NUMBER,
ABSORBANCE		VARCHAR2(12),
RATIO			VARCHAR2(17),
PLATE_ID		VARCHAR2(40),
RESULT_DATE		DATE,
RESULT_USER_ID		VARCHAR2(30),
ERROR_CODE		VARCHAR2(10),
RECORD_SEQUENCE		NUMBER,
PATIENT_LAST_NAME	VARCHAR2(50),
PATIENT_FIRST_NAME	VARCHAR2(50),
PATIENT_DOB		DATE,
COMMENTS		VARCHAR2(300),
SKIP_RECORD		VARCHAR2(1),
UPLOAD_STATUS		VARCHAR2(1),
INSERT_DATE		DATE		NOT NULL,
INSERT_USER		VARCHAR2(30)	NOT NULL,
AUDIT_KEY		NUMBER		NOT NULL
);

Create Or Replace Public Synonym API_INST_TEST_RESULTS_ARC for LTAPI.API_INST_TEST_RESULTS_ARC;

Grant Select,insert,update,delete on LTAPI.API_INST_TEST_RESULTS_ARC to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;

Create Table LTAPI.API_INST_UPLOAD_STATUS
(
MACHINE_ID	VARCHAR2(5)	NOT NULL,
CHAPTER_ID	VARCHAR2(4)	NOT NULL,
FILE_ID		VARCHAR2(50)	NOT NULL,
LT_TB_ID	VARCHAR2(14)	NOT NULL,
UPLOAD_STATUS	VARCHAR2(1)	NOT NULL,
TOT_REC_PROCESSED		NUMBER,
TOT_REC_LOADED			NUMBER,
TOT_REC_REJECTED		NUMBER,
LOG_FILE_NAME			VARCHAR2(240),
PROCESS_DATE	DATE		NOT NULL,
AUDIT_KEY	NUMBER		NOT NULL
);

Create Or Replace Public Synonym API_INST_UPLOAD_STATUS for LTAPI.API_INST_UPLOAD_STATUS;

Grant Select,insert,update,delete on LTAPI.API_INST_UPLOAD_STATUS to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;


CREATE TABLE LTAPI.API_LOCKED_FILE
(
MACHINE_ID	VARCHAR2(5)	NOT NULL,
CHAPTER_ID	VARCHAR2(4)	NOT NULL,
FILE_ID		VARCHAR2(50)	NOT NULL,
LOCKED_ON	DATE
);

Create Or Replace Public Synonym API_LOCKED_FILE for LTAPI.API_LOCKED_FILE;

Grant Select,insert,update,delete on LTAPI.API_LOCKED_FILE to OPS$SBCSYS,OPS$SRVSYS,UTIL,OPS$DBADMN,LT_LAB;

----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER LTAPI.API_INST_TEST_RESULTS_bi
before insert
on API_INST_TEST_RESULTS
for each row
begin
  if :new.insert_user is null then
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  end if;
  if :new.insert_date is null then
    :new.insert_date := sysdate ;
  end if;

 -- if :new.audit_key is null then
    select audit_seq.nextval into :new.audit_key from dual;
 -- end if;

  end;
/


---------------------------------------------------------------

CREATE OR REPLACE TRIGGER LTAPI.API_INST_TEST_RESULTS_bu
before update
on API_INST_TEST_RESULTS
for each row
DECLARE
 l_user VARCHAR2(30);
BEGIN

     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
                                        'U',
                                        'MACHINE_RESULT' ,
                                        :old.MACHINE_RESULT ,
                                        :new.MACHINE_RESULT  );
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
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
                                        l_user ,
                                        'U',
                                        'SKIP_RECORD' ,
                                        :old.SKIP_RECORD ,
                                        :new.SKIP_RECORD );
                end;

        end if;



end;
/



----------------------------------------------------------------

CREATE OR REPLACE TRIGGER LTAPI.API_INST_TEST_RESULTS_bd
before delete
on API_INST_TEST_RESULTS
for each row
DECLARE
 l_user VARCHAR2(30);
BEGIN

     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
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
                                        'NULL');
                end;



  end;
/



------------------------

CREATE OR REPLACE TRIGGER LTAPI.API_INST_ERROR_HANDLING_BI
BEFORE INSERT
ON LTAPI.API_INST_ERROR_HANDLING
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin
if :new.insert_user is null then
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
end if;
if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;
--if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
--end if;

if :new.program_id is null then
 :new.program_id := 'MANUAL';
end if;
end ;
/



--------------------------------------------------------

CREATE OR REPLACE TRIGGER LTAPI.API_INST_ERROR_HANDLING_BU
 BEFORE UPDATE
 ON LTAPI.API_INST_ERROR_HANDLING
 FOR EACH ROW
DECLARE
 l_user VARCHAR2(30);
BEGIN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into l_user from dual ;
  if nvl(:old.machine_id, '*') != nvl(:new.machine_id, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'machine_id',
     :old.machine_id,
     :new.machine_id);
   end;
  end if;
   
  if nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'chapter_id',
     :old.chapter_id,
     :new.chapter_id);
   end;
  end if;
  
  if nvl(:old.test_id, '*') != nvl(:new.test_id, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'test_id',
     :old.test_id,
     :new.test_id);
   end;
  end if;
  if nvl(:old.error_code, '*') != nvl(:new.error_code, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'error_code',
     :old.error_code,
     :new.error_code);
   end;
  end if;
  if nvl(:old.error_desc, '*') != nvl(:new.error_desc, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'error_desc',
     :old.error_desc,
     :new.error_desc);
   end;
  end if;  
 
  if nvl(:old.skip_level, '*') != nvl(:new.skip_level, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'skip_level',
     :old.skip_level,
     :new.skip_level);
   end;
  end if;  

 if nvl(:old.eff_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.eff_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
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
			:new.program_id ,
			l_user,
			'U',
			'eff_date' ,
			to_char(:old.eff_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.eff_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;  

 if nvl(:old.term_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.term_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
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
			:new.program_id ,
			l_user,
			'U',
			'term_date' ,
			to_char(:old.term_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.term_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;  
  
 if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
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
			:new.program_id ,
			l_user,
			'U',
			'insert_date' ,
			to_char(:old.insert_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.insert_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;
      if nvl(:old.insert_user,'*') !=
	 nvl(:new.insert_user,'*')
      then
	 begin
	    insert into api_inst_error_handling_audit (
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
			:new.program_id ,
			l_user,
			'U',
			'insert_user' ,
			:old.insert_user ,
			:new.insert_user  );
	 end;
 end if;
---
end;
/



---------------------------------------------------------------------

CREATE OR REPLACE TRIGGER LTAPI.API_INST_ERROR_HANDLING_BD
 BEFORE DELETE
 ON API_INST_ERROR_HANDLING
 FOR EACH ROW
DECLARE
 l_user VARCHAR2(30);
BEGIN

     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into l_user from dual ;
--

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'machine_id' ,
:old.machine_id ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'chapter_id' ,
:old.chapter_id ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'error_code' ,
:old.error_code ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'error_desc' ,
:old.error_desc ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'skip_level' ,
:old.skip_level ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'eff_date' ,
:old.eff_date,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'term_date' ,
:old.term_date ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'insert_date' ,
:old.insert_date ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'insert_user' ,
:old.insert_user ,
'NULL');
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
l_user,
'D',
'test_id' ,
:old.test_id ,
'NULL');
end;
end;
/



-----------------------------------------

