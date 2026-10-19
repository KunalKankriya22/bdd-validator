SET SERVEROUTPUT ON;
DECLARE
    lv_status VARCHAR2(1000);
BEGIN

    AG_TIETAG_LBL.gen_tietag_file(pUnitId           => 'W633324062502', --'W633324052101',
                                  pAboCode          => '51',
                              pExpDate              => TO_DATE('06152024', 'MMDDYYYY'),
                              pPrintAgCodes         => 'K,s', --'C,N,K',
                              pPrinterId            => NULL,
                              pNoLabels             => 1,
                              pUserId               => 'CELHUN',
                              pChapterId            => 'DAL',
                              pStatus               => lv_status);
                              
    DBMS_OUTPUT.PUT_LINE('Status ' || lv_status);                              
END;                            