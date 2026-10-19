--------------------------------------------------------
--  DDL for Trigger ONLINE_STATUS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "ONLINE_STATUS_BU" before UPDATE
 ON ONLINE_STATUS
 FOR EACH ROW
DECLARE
    audit_rec online_status_audit%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in online_status_audit%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO online_status_audit VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := 'ONLINE_STATUS';
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
--
    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        audit_rec.column_name := 'transaction_id';
        audit_rec.old_value := :old.transaction_id;
        audit_rec.new_value := :new.transaction_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lookup_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lookup_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'lookup_start';
        audit_rec.old_value := to_char(:old.lookup_start, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.lookup_start, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.lookup_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lookup_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'lookup_end';
        audit_rec.old_value := to_char(:old.lookup_end, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.lookup_end, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.lkup_ovr_rsn, '*') != nvl(:new.lkup_ovr_rsn, '*') THEN
        audit_rec.column_name := 'lkup_ovr_rsn';
        audit_rec.old_value := :old.lkup_ovr_rsn;
        audit_rec.new_value := :new.lkup_ovr_rsn;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.lkup_updt_by, '*') != nvl(:new.lkup_updt_by, '*') THEN
        audit_rec.column_name := 'lkup_updt_by';
        audit_rec.old_value := :old.lkup_updt_by;
        audit_rec.new_value := :new.lkup_updt_by;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lkup_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lkup_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'lkup_updt_time';
        audit_rec.old_value := to_char(:old.lkup_updt_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.lkup_updt_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.hlth_hist_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_hist_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'hlth_hist_start';
        audit_rec.old_value := to_char(:old.hlth_hist_start, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.hlth_hist_start, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.hlth_hist_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_hist_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'hlth_hist_end';
        audit_rec.old_value := to_char(:old.hlth_hist_end, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.hlth_hist_end, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.hlth_hist_ovr_rsn, '*') != nvl(:new.hlth_hist_ovr_rsn, '*') THEN
        audit_rec.column_name := 'hlth_hist_ovr_rsn';
        audit_rec.old_value := :old.hlth_hist_ovr_rsn;
        audit_rec.new_value := :new.hlth_hist_ovr_rsn;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.hlth_updt_by, '*') != nvl(:new.hlth_updt_by, '*') THEN
        audit_rec.column_name := 'hlth_updt_by';
        audit_rec.old_value := :old.hlth_updt_by;
        audit_rec.new_value := :new.hlth_updt_by;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.hlth_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'hlth_updt_time';
        audit_rec.old_value := to_char(:old.hlth_updt_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.hlth_updt_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phy_findings_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_findings_start, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'phy_findings_start';
        audit_rec.old_value := to_char(:old.phy_findings_start, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phy_findings_start, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phy_findings_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_findings_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'phy_findings_end';
        audit_rec.old_value := to_char(:old.phy_findings_end, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phy_findings_end, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phy_ovr_rsn, '*') != nvl(:new.phy_ovr_rsn, '*') THEN
        audit_rec.column_name := 'phy_ovr_rsn';
        audit_rec.old_value := :old.phy_ovr_rsn;
        audit_rec.new_value := :new.phy_ovr_rsn;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.phy_updt_by, '*') != nvl(:new.phy_updt_by, '*') THEN
        audit_rec.column_name := 'phy_updt_by';
        audit_rec.old_value := :old.phy_updt_by;
        audit_rec.new_value := :new.phy_updt_by;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.phy_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'phy_updt_time';
        audit_rec.old_value := to_char(:old.phy_updt_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phy_updt_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phelob_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'phelob_start';
        audit_rec.old_value := to_char(:old.phelob_start, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phelob_start, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phelob_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'phelob_end';
        audit_rec.old_value := to_char(:old.phelob_end, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phelob_end, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.phelob_updt_by, '*') != nvl(:new.phelob_updt_by, '*') THEN
        audit_rec.column_name := 'phelob_updt_by';
        audit_rec.old_value := :old.phelob_updt_by;
        audit_rec.new_value := :new.phelob_updt_by;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.phelob_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'phelob_updt_time';
        audit_rec.old_value := to_char(:old.phelob_updt_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.phelob_updt_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.donor_stopped_at, '*') != nvl(:new.donor_stopped_at, '*') THEN
        audit_rec.column_name := 'donor_stopped_at';
        audit_rec.old_value := :old.donor_stopped_at;
        audit_rec.new_value := :new.donor_stopped_at;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.status_flag, '*') != nvl(:new.status_flag, '*') THEN
        audit_rec.column_name := 'status_flag';
        audit_rec.old_value := :old.status_flag;
        audit_rec.new_value := :new.status_flag;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.comments, '*') != nvl(:new.comments, '*') THEN
        audit_rec.column_name := 'comments';
        audit_rec.old_value := :old.comments;
        audit_rec.new_value := :new.comments;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.print_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.print_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'print_date';
        audit_rec.old_value := to_char(:old.print_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.print_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.unit_status, '*') != nvl(:new.unit_status, '*') THEN
        audit_rec.column_name := 'unit_status';
        audit_rec.old_value := :old.unit_status;
        audit_rec.new_value := :new.unit_status;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.unit_status_updt_by, '*') != nvl(:new.unit_status_updt_by, '*') THEN
        audit_rec.column_name := 'unit_status_updt_by';
        audit_rec.old_value := :old.unit_status_updt_by;
        audit_rec.new_value := :new.unit_status_updt_by;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.unit_status_updt_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.unit_status_updt_on, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'unit_status_updt_on';
        audit_rec.old_value := to_char(:old.unit_status_updt_on, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.unit_status_updt_on, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.competency_ques, '*') != nvl(:new.competency_ques, '*') THEN
        audit_rec.column_name := 'competency_ques';
        audit_rec.old_value := :old.competency_ques;
        audit_rec.new_value := :new.competency_ques;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.competency_ans, '*') != nvl(:new.competency_ans, '*') THEN
        audit_rec.column_name := 'competency_ans';
        audit_rec.old_value := :old.competency_ans;
        audit_rec.new_value := :new.competency_ans;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.competency_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.competency_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'competency_on';
        audit_rec.old_value := to_char(:old.competency_on, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.competency_on, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        audit_rec.column_name := 'donor_id';
        audit_rec.old_value := :old.donor_id;
        audit_rec.new_value := :new.donor_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.drive_id, '*') != nvl(:new.drive_id, '*') THEN
        audit_rec.column_name := 'drive_id';
        audit_rec.old_value := :old.drive_id;
        audit_rec.new_value := :new.drive_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.drive_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.drive_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'drive_date';
        audit_rec.old_value := to_char(:old.drive_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.drive_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.idp_proc_code, '*') != nvl(:new.idp_proc_code, '*') THEN
        audit_rec.column_name := 'idp_proc_code';
        audit_rec.old_value := :old.idp_proc_code;
        audit_rec.new_value := :new.idp_proc_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.idp_proc_status, '*') != nvl(:new.idp_proc_status, '*') THEN
        audit_rec.column_name := 'idp_proc_status';
        audit_rec.old_value := :old.idp_proc_status;
        audit_rec.new_value := :new.idp_proc_status;
        insert_audit_rec(audit_rec);
    end IF;

    IF nvl(:old.idp_proc_status_dats, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.idp_proc_status_dats, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) 
    THEN
        audit_rec.column_name := 'idp_proc_status_dats';
        audit_rec.old_value := to_char(:old.idp_proc_status_dats, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.idp_proc_status_dats, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.donor_id_verified, '*') != nvl(:new.donor_id_verified, '*') THEN
        audit_rec.column_name := 'donor_id_verified';
        audit_rec.old_value := :old.donor_id_verified;
        audit_rec.new_value := :new.donor_id_verified;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.audit_key, -1) != nvl(:new.audit_key, -1) THEN
        audit_rec.column_name := 'audit_key';
        audit_rec.old_value := :old.audit_key;
        audit_rec.new_value := :new.audit_key;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);     
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);    
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('ONLINE_STATUS', 'U', :OLD.audit_key);
    END IF;    

END;
/
ALTER TRIGGER "ONLINE_STATUS_BU" ENABLE;
