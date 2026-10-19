SET SERVEROUTPUT ON;

DECLARE
    lv_test_result VARCHAR2(200) := 'k,-,Jka,-,Jsb,-,s,-,Fyb,-,Leb,-,CMV,-';
    lv_content_string VARCHAR2(100);
    lv_status VARCHAR2(100);
    p_chk_digit VARCHAR2(10);
BEGIN

    AG_LBL.get_data_content_string(
        test_results_in     => lv_test_result,
        content_string_out  => lv_content_string,
        status_out          => lv_status
        ); 
        
    
    dbms_output.put_line('chk digit ' || p_chk_digit);

    DBMS_OUTPUT.PUT_LINE('Input string: ' || lv_test_result);
    DBMS_OUTPUT.PUT_LINE('Content String: ' || lv_content_string);
    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);
END;

