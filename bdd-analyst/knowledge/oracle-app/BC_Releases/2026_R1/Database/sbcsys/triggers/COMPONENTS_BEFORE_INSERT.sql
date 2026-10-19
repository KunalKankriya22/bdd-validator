--------------------------------------------------------
--  DDL for Trigger COMPONENTS_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENTS_BEFORE_INSERT" 
BEFORE INSERT
ON SBCSYS.COMPONENTS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --
    insert into components_audit
    (
	unit_id, coll_date, chapter_id,
	component_prefix, product_code, bag_id,
	expiry_date, system_label_decision,
	reject_reason_code, insert_dats,
	relabel_product_code, pooled_component_id,
	void_reason_code,component_status,
	out_of_system_dats, component_weight, component_count,
	note_id, label_user_id, label_dats,bags_used,
	warehouse_id, imp_license_flag, PRE_LABEL_SLD, PRE_LABEL_USER_ID, PRE_LABEL_DATS,
	audit_key,program_id,audit_insert_dats, audit_insert_user
    )
    values
    (
	:new.unit_id, :new.coll_date, :new.chapter_id,
	:new.component_prefix, :new.product_code, :new.bag_id,
	:new.expiry_date, :new.system_label_decision,
	:new.reject_reason_code, :new.insert_dats,
	:new.relabel_product_code, :new.pooled_component_id,
	:new.void_reason_code,:new.component_status,
	:new.out_of_system_dats, :new.component_weight, :new.component_count,
	:new.note_id, :new.label_user_id, :new.label_dats,:new.bags_used,
	:new.warehouse_id,:new.imp_license_flag, :new.PRE_LABEL_SLD, :new.PRE_LABEL_USER_ID, :new.PRE_LABEL_DATS,
	:new.audit_key,:new.program_id,sysdate, lt_user_session.get_userid
    );
    if :new.reject_reason_code is not null
       and :new.system_label_decision is null
    then
	if length(:old.unit_id) = 13 then
	   :new.system_label_decision := 'Md';
	else
	   :new.system_label_decision := '47';
	end if;
	:new.label_dats := sysdate;
	:new.label_user_id := lt_user_session.get_userid;
    end if;
    insert into component_attributes
       (unit_id, coll_date, chapter_id, product_code, attrib_group, attrib_code,
	insert_dats, insert_user_id, audit_key, program_id, proc_date)
       select
       :new.unit_id, :new.coll_date, :new.chapter_id, :new.product_code,
	'SP', 'SCAF', sysdate, lt_user_session.get_userid, :new.audit_key,
	:new.program_id, sysdate from sys.dual
       where exists (
	     select 'X' from unit_attributes ua, valid_products vp
	      where vp.product_type = 'PPPBS'
		and vp.product_code = :new.product_code
		and ua.unit_id = :new.unit_id
		and ua.coll_date = :new.coll_date
		and ua.chapter_id = :new.chapter_id
		and ua.attrib_group = 'DON'
		and ua.attrib_code in ('00','01','02','03','04','05','06',
					    '15','16','17','18','19','20'))
      and not exists (
	      select 'X' from component_attributes
	       where unit_id = :new.unit_id
		 and coll_date = :new.coll_date
		 and chapter_id = :new.chapter_id
		 and product_code = :new.product_code
		 and attrib_group = 'SP'
		 and attrib_code = 'SCAF');

   emf_util.staging_insert('COMPONENTS', :NEW.audit_key, :NEW.program_id, 'LAB', 'COMPONENTS_BEFORE_INSERT','I');
end;

/
ALTER TRIGGER "COMPONENTS_BEFORE_INSERT" ENABLE;
