SET SERVEROUTPUT ON;

DECLARE
    ld_start_date DATE  := TO_DATE('01-01-2014', 'MM-DD-YYYY');
    ld_end_date DATE    := TO_DATE('05-15-2024', 'MM-DD-YYYY');
    lv_status VARCHAR2(2000);
BEGIN
    AG_CORE.handle_hist_antigens(ld_start_date, ld_end_date, 12, lv_status);
    
    DBMS_OUTPUT.PUT_LINE('Status ' || lv_status);
END;