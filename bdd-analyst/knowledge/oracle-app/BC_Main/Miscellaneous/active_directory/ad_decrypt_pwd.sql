DECLARE
    l_encrypted_raw RAW(2048);
    l_key           RAW(128) := UTL_RAW.cast_to_raw('tttt');
    l_decrypted_raw RAW(128);
    l_decrypted_pwd VARCHAR2(100);
BEGIN
    -- Retrieve the encrypted password from the database
    SELECT ad_svc_pwd
    INTO l_encrypted_raw
    FROM active_directory_config
    WHERE ROWNUM = 1;  -- Adjust WHERE clause as needed

    -- Decrypt the password
    l_decrypted_raw := DBMS_CRYPTO.decrypt(
        src => l_encrypted_raw,
        typ => DBMS_CRYPTO.des_cbc_pkcs5,
        key => l_key
    );

    -- Convert RAW back to VARCHAR2
    l_decrypted_pwd := UTL_RAW.cast_to_varchar2(l_decrypted_raw);

    -- Display the decrypted password
    DBMS_OUTPUT.PUT_LINE('Decrypted Password: ' || l_decrypted_pwd);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('No data found in active_directory_config table.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
END;
/

flnASpL#HUStidrl4RaC