--------------------------------------------------------
--  DDL for Trigger VSERV_ORDER_CLASSES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ORDER_CLASSES_BI" before insert on VSERV_ORDER_CLASSES
for each row
declare
  temp_audit_key	number(23);
  nCount      	  	number := 0;
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
   -- Check if the table is institution level
   select nvl(count(*),0)
     into nCount
     from institution_tables
    where table_name = 'VSERV_ORDER_CLASSES' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
   If nCount > 0 then
     :new.chapter_id := 'ALL';
   End If;
   --
  insert into VSERV_ORDER_CLASSES_AUDIT
  (	ORDER_CLASS,
	CHAPTER_ID,
	ORDER_PRIORITY,
	CLASS_DESC,
	PROCESS_HOURS,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	DISPLAY_FLAG,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.ORDER_CLASS,
	:new.CHAPTER_ID,
	:new.ORDER_PRIORITY,
	:new.CLASS_DESC,
	:new.PROCESS_HOURS,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.DISPLAY_FLAG,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ORDER_CLASSES_BI" ENABLE;
