---
tags:
  - trigger
  - DONSYS
---
# ONLINE_STATUS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/ONLINE_STATUS|ONLINE_STATUS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    PROCEDURE insert_audit(p_column_name VARCHAR2, p_old_value VARCHAR2, p_new_value VARCHAR2) IS
    BEGIN
        INSERT INTO online_status_audit (
            audit_key,
            audit_insert_dats,
            program_id,
            user_id,
            action_code,
            column_name,
            old_value,
            new_value
        ) VALUES (
            :old.audit_key,
            sysdate,
            'ONLINE_STATUS',
            substr(lt_user_session.get_userid, 1, 6),
            'U',
            p_column_name,
            p_old_value,
            p_new_value
        );
    END insert_audit;
BEGIN    
    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        insert_audit('TRANSACTION_ID', :old.transaction_id, :new.transaction_id);
    END IF;

    IF nvl(:old.lookup_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lookup_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('LOOKUP_START', to_char(:old.lookup_start, 'MM-DD-YYYY HH24:MI'), to_char(:new.lookup_start, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.lookup_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lookup_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('LOOKUP_END', to_char(:old.lookup_end, 'MM-DD-YYYY HH24:MI'), to_char(:new.lookup_end, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.lkup_ovr_rsn, '*') != nvl(:new.lkup_ovr_rsn, '*') THEN
        insert_audit('LKUP_OVR_RSN', :old.lkup_ovr_rsn, :new.lkup_ovr_rsn);
    END IF;

    IF nvl(:old.lkup_updt_by, '*') != nvl(:new.lkup_updt_by, '*') THEN
        insert_audit('LKUP_UPDT_BY', :old.lkup_updt_by, :new.lkup_updt_by);
    END IF;

    IF nvl(:old.lkup_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.lkup_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('LKUP_UPDT_TIME', to_char(:old.lkup_updt_time, 'MM-DD-YYYY HH24:MI'), to_char(:new.lkup_updt_time, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.hlth_hist_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_hist_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('HLTH_HIST_START', to_char(:old.hlth_hist_start, 'MM-DD-YYYY HH24:MI'), to_char(:new.hlth_hist_start, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.hlth_hist_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_hist_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('HLTH_HIST_END', to_char(:old.hlth_hist_end, 'MM-DD-YYYY HH24:MI'), to_char(:new.hlth_hist_end, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.hlth_hist_ovr_rsn, '*') != nvl(:new.hlth_hist_ovr_rsn, '*') THEN
        insert_audit('HLTH_HIST_OVR_RSN', :old.hlth_hist_ovr_rsn, :new.hlth_hist_ovr_rsn);
    END IF;

    IF nvl(:old.hlth_updt_by, '*') != nvl(:new.hlth_updt_by, '*') THEN
        insert_audit('HLTH_UPDT_BY', :old.hlth_updt_by, :new.hlth_updt_by);
    END IF;

    IF nvl(:old.hlth_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.hlth_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('HLTH_UPDT_TIME', to_char(:old.hlth_updt_time, 'MM-DD-YYYY HH24:MI'), to_char(:new.hlth_updt_time, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phy_findings_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_findings_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHY_FINDINGS_START', to_char(:old.phy_findings_start, 'MM-DD-YYYY HH24:MI'), to_char(:new.phy_findings_start, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phy_findings_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_findings_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHY_FINDINGS_END', to_char(:old.phy_findings_end, 'MM-DD-YYYY HH24:MI'), to_char(:new.phy_findings_end, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phy_ovr_rsn, '*') != nvl(:new.phy_ovr_rsn, '*') THEN
        insert_audit('PHY_OVR_RSN', :old.phy_ovr_rsn, :new.phy_ovr_rsn);
    END IF;

    IF nvl(:old.phy_updt_by, '*') != nvl(:new.phy_updt_by, '*') THEN
        insert_audit('PHY_UPDT_BY', :old.phy_updt_by, :new.phy_updt_by);
    END IF;

    IF nvl(:old.phy_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phy_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHY_UPDT_TIME', to_char(:old.phy_updt_time, 'MM-DD-YYYY HH24:MI'), to_char(:new.phy_updt_time, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phelob_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_start, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHELOB_START', to_char(:old.phelob_start, 'MM-DD-YYYY HH24:MI'), to_char(:new.phelob_start, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phelob_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_end, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHELOB_END', to_char(:old.phelob_end, 'MM-DD-YYYY HH24:MI'), to_char(:new.phelob_end, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.phelob_updt_by, '*') != nvl(:new.phelob_updt_by, '*') THEN
        insert_audit('PHELOB_UPDT_BY', :old.phelob_updt_by, :new.phelob_updt_by);
    END IF;

    IF nvl(:old.phelob_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.phelob_updt_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PHELOB_UPDT_TIME', to_char(:old.phelob_updt_time, 'MM-DD-YYYY HH24:MI'), to_char(:new.phelob_updt_time, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.donor_stopped_at, '*') != nvl(:new.donor_stopped_at, '*') THEN
        insert_audit('DONOR_STOPPED_AT', :old.donor_stopped_at, :new.donor_stopped_at);
    END IF;

    IF nvl(:old.status_flag, '*') != nvl(:new.status_flag, '*') THEN
        insert_audit('STATUS_FLAG', :old.status_flag, :new.status_flag);
    END IF;

    IF nvl(:old.comments, '*') != nvl(:new.comments, '*') THEN
        insert_audit('COMMENTS', :old.comments, :new.comments);
    END IF;

    IF nvl(:old.print_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.print_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('PRINT_DATE', to_char(:old.print_date, 'MM-DD-YYYY HH24:MI'), to_char(:new.print_date, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.unit_status, '*') != nvl(:new.unit_status, '*') THEN
        insert_audit('UNIT_STATUS', :old.unit_status, :new.unit_status);
    END IF;

    IF nvl(:old.unit_status_updt_by, '*') != nvl(:new.unit_status_updt_by, '*') THEN
        insert_audit('UNIT_STATUS_UPDT_BY', :old.unit_status_updt_by, :new.unit_status_updt_by);
    END IF;

    IF nvl(:old.unit_status_updt_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.unit_status_updt_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('UNIT_STATUS_UPDT_ON', to_char(:old.unit_status_updt_on, 'MM-DD-YYYY HH24:MI'), to_char(:new.unit_status_updt_on, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.competency_ques, '*') != nvl(:new.competency_ques, '*') THEN
        insert_audit('COMPETENCY_QUES', :old.competency_ques, :new.competency_ques);
    END IF;

    IF nvl(:old.competency_ans, '*') != nvl(:new.competency_ans, '*') THEN
        insert_audit('COMPETENCY_ANS', :old.competency_ans, :new.competency_ans);
    END IF;

    IF nvl(:old.competency_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.competency_on, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('COMPETENCY_ON', to_char(:old.competency_on, 'MM-DD-YYYY HH24:MI'), to_char(:new.competency_on, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        insert_audit('DONOR_ID', :old.donor_id, :new.donor_id);
    END IF;

    IF nvl(:old.drive_id, '*') != nvl(:new.drive_id, '*') THEN
        insert_audit('DRIVE_ID', :old.drive_id, :new.drive_id);
    END IF;

    IF nvl(:old.drive_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.drive_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('DRIVE_DATE', to_char(:old.drive_date, 'MM-DD-YYYY HH24:MI'), to_char(:new.drive_date, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.idp_proc_code, '*') != nvl(:new.idp_proc_code, '*') THEN
        insert_audit('IDP_PROC_CODE', :old.idp_proc_code, :new.idp_proc_code);
    END IF;

    IF nvl(:old.idp_proc_status, '*') != nvl(:new.idp_proc_status, '*') THEN
        insert_audit('IDP_PROC_STATUS', :old.idp_proc_status, :new.idp_proc_status);
    END IF;

    IF nvl(:old.idp_proc_status_dats, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.idp_proc_status_dats, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('IDP_PROC_STATUS_DATS', to_char(:old.idp_proc_status_dats, 'MM-DD-YYYY HH24:MI'), to_char(:new.idp_proc_status_dats, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.donor_id_verified, '*') != nvl(:new.donor_id_verified, '*') THEN
        insert_audit('DONOR_ID_VERIFIED', :old.donor_id_verified, :new.donor_id_verified);
    END IF;

    IF nvl(:old.audit_key, -1) != nvl(:new.audit_key, -1) THEN
        insert_audit('AUDIT_KEY', :old.audit_key, :new.audit_key);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('INSERT_DATE', to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI'), to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI'));
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        insert_audit('INSERT_USER', :old.insert_user, :new.insert_user);
    END IF;

    IF nvl(:old.UNDER_PROCESSING_FLAG, '*') != nvl(:new.UNDER_PROCESSING_FLAG, '*') THEN
        insert_audit('UNDER_PROCESSING_FLAG', :old.UNDER_PROCESSING_FLAG, :new.UNDER_PROCESSING_FLAG);
    END IF;

    IF nvl(:old.SURVEY_STATUS, '*') != nvl(:new.SURVEY_STATUS, '*') THEN
        insert_audit('SURVEY_STATUS', :old.SURVEY_STATUS, :new.SURVEY_STATUS);
    END IF;

    IF nvl(:old.WEB_RESPONSES_DOWNLOADED, '*') != nvl(:new.WEB_RESPONSES_DOWNLOADED, '*') THEN
        insert_audit('WEB_RESPONSES_DOWNLOADED', :old.WEB_RESPONSES_DOWNLOADED, :new.WEB_RESPONSES_DOWNLOADED);
    END IF;

    IF nvl(:old.WLKOUT_BY, '*') != nvl(:new.WLKOUT_BY, '*') THEN
        insert_audit('WLKOUT_BY', :old.WLKOUT_BY, :new.WLKOUT_BY);
    END IF;

    IF nvl(:old.WLKOUT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.WLKOUT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        insert_audit('WLKOUT_DATE', :old.WLKOUT_DATE, :new.WLKOUT_DATE);
    END IF;    
END;
```
