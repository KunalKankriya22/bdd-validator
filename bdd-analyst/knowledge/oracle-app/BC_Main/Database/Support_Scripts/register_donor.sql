/*
    Script: To investigate database issue while registering a donor.
    Notes:
        Luminis(AAMC) Support Case
            Issue: Unable to register donor.
            Root Cause: Insert into central_notes table failed due to inserting a 14 digit note ID in a 10 digit note ID.
            Fix: Reset the audit sequence and note sequence to a smaller value so that they do not run over 10 digits for note id.
    Date: 08/15/2024
*/


SET SERVEROUTPUT ON;
DECLARE
    lv_tbvh             VARCHAR2(100);
    lb_newdonor         BOOLEAN := TRUE;
    donor_rec           donors%rowtype;
    donor_picture_rec   donor_pictures%rowtype;
    donor_address_rec   donor_addresses%rowtype;
    donation_rec        donations%rowtype;
    online_status_rec   online_status%rowtype;
    lv_status   VARCHAR2(2000);

    TYPE registrationrequestdto IS RECORD (
            is_new                 BOOLEAN,
            credit_count           NUMBER,
            usps_id                NUMBER,
            e_usps_id              NUMBER,
            set_id                 VARCHAR2(100),
            transaction_id         VARCHAR2(100),
        --Y_DONOR DonorForReturnDto,
        --H_DONORS DonorForReturnDtoList,
        --DRIVE DriveForSelectionDto,
            drive_id               VARCHAR2(100),
            drive_date             DATE,
            employer_id            VARCHAR2(100),
            id_verified            VARCHAR2(1),
            id_queued              BOOLEAN,
            donation_type          VARCHAR2(100),
            procedure_code         VARCHAR2(100),
            equipment_code         VARCHAR2(100),
            donor_id               VARCHAR2(100),
            ssn                    NUMBER,
            date_of_birth          DATE,
            age_displayed          VARCHAR2(100),
            alternate_id           VARCHAR2(100),
            alternate_id_type      VARCHAR2(100),
            scan_id                VARCHAR2(100),
            blood_code             VARCHAR2(100),
            abo                    VARCHAR2(100),
            first_name             VARCHAR2(100),
            middle_name            VARCHAR2(100),
            last_name              VARCHAR2(100),
            alias                  VARCHAR2(100),
            last_name_suffix       VARCHAR2(100),
            gender                 VARCHAR2(100),
            ethnic_group           VARCHAR2(100),
            height                 VARCHAR2(100),
            donor_weight           NUMBER,
            street_name            VARCHAR2(100),
            city                   VARCHAR2(100),
            state                  VARCHAR2(100),
            zip                    VARCHAR2(100),
            apt                    VARCHAR2(100),
            h_area_code            VARCHAR2(100),
            h_phone_no             VARCHAR2(100),
            d_area_code            VARCHAR2(100),
            d_phone_no             VARCHAR2(100),
            extension              NUMBER,
            m_area_code            VARCHAR2(100),
            m_phone_no             VARCHAR2(100),
            preferred_contact_flag VARCHAR2(100),
            email                  VARCHAR2(100),
            employer_name          VARCHAR2(100),
            e_city                 VARCHAR2(100),
            e_state                VARCHAR2(100),
            e_zip                  VARCHAR2(100),
            alternate_sponsor_id   VARCHAR2(100),
            lookup_start           DATE,
            lifetime_don           NUMBER,
            lifetime_cr            NUMBER,
            ytd_don                NUMBER,
            ytd_cr                 NUMBER,
            last_don_type          VARCHAR2(100),
            last_proc_code         VARCHAR2(100),
            last_coll_date         DATE,
            last_unit_id           VARCHAR2(100),
        --OVR_DEF_INFO OverrideDeferralReturnDto,
        --DONOR_INQUIRY DonorInquiryResponseDto,
            elig_status            VARCHAR2(100),
            staff_no               VARCHAR2(100),
        --DONOR_WALKOUT_INFO RegistrationWalkOutDto,
        --WALKOUT_ATTRIB BOOLEAN,
        --DONOR_PICTURE BLOB,
            TBV_INFO               VARCHAR2(100),
        --InternationalAddress InternationalAddressDto,
        --AlternateAddress AlternateAddressDto
            user_id                VARCHAR2(100),
            program_id             VARCHAR2(100),
            chapter_id             VARCHAR2(100),
            multi_chapter_id       VARCHAR2(100)
    );
    registrationrequest registrationrequestdto;

    PROCEDURE initialize_registration_request AS
    BEGIN
        registrationrequest.is_new := TRUE;
        registrationrequest.credit_count := 0;
        registrationrequest.usps_id := NULL;
        registrationrequest.e_usps_id := NULL;
        registrationrequest.set_id := 'ONSITE';
        registrationrequest.transaction_id := 'AV02882825';
        registrationrequest.drive_id := 'DRV0171803';
        registrationrequest.drive_date := TO_DATE ( '2024-08-13', 'YYYY-MM-DD' );
        registrationrequest.employer_id := NULL;
        registrationrequest.id_verified := 'Y';
        registrationrequest.id_queued := FALSE;
        registrationrequest.donation_type := 'AL';
        registrationrequest.procedure_code := 'WB';
        registrationrequest.equipment_code := NULL;
        registrationrequest.donor_id := NULL;
        registrationrequest.ssn := NULL;
        registrationrequest.date_of_birth := TO_DATE ( '1980-12-12', 'YYYY-MM-DD' );
        registrationrequest.age_displayed := NULL;
        registrationrequest.alternate_id := NULL;
        registrationrequest.alternate_id_type := NULL;
        registrationrequest.scan_id := NULL;
        registrationrequest.blood_code := NULL;
        registrationrequest.abo := NULL;
        registrationrequest.first_name := 'WILLIAM';
        registrationrequest.middle_name := NULL;
        registrationrequest.last_name := 'WELLSKY';
        registrationrequest.alias := NULL;
        registrationrequest.last_name_suffix := NULL;
        registrationrequest.gender := 'M';
        registrationrequest.ethnic_group := NULL;
        registrationrequest.height := '5''5"';
        registrationrequest.donor_weight := '155';
        registrationrequest.street_name := '1900 SPRING RD';
        registrationrequest.city := 'OAKBROOK';
        registrationrequest.state := 'IL';
        registrationrequest.zip := '60523';
        registrationrequest.apt := NULL;
        registrationrequest.h_area_code := NULL;
        registrationrequest.h_phone_no := NULL;
        registrationrequest.d_area_code := NULL;
        registrationrequest.d_phone_no := NULL;
        registrationrequest.extension := NULL;
        registrationrequest.m_area_code := NULL;
        registrationrequest.m_phone_no := NULL;
        registrationrequest.preferred_contact_flag := NULL;
        registrationrequest.email := NULL;
        registrationrequest.employer_name := NULL;
        registrationrequest.e_city := NULL;
        registrationrequest.e_state := NULL;
        registrationrequest.e_zip := NULL;
        registrationrequest.alternate_sponsor_id := NULL;
        registrationrequest.lookup_start := NULL;
        registrationrequest.lifetime_don := NULL;
        registrationrequest.lifetime_cr := NULL;
        registrationrequest.ytd_don := NULL;
        registrationrequest.ytd_cr := NULL;
        registrationrequest.last_don_type := NULL;
        registrationrequest.last_proc_code := NULL;
        registrationrequest.last_coll_date := NULL;
        registrationrequest.last_unit_id := NULL;
        registrationrequest.elig_status := 'Y';
        registrationrequest.staff_no := 'DBADMN';
        registrationrequest.tbv_info := NULL;
        registrationrequest.user_id := 'DBADMN';
        registrationrequest.program_id := 'ONPLKREG';
        registrationrequest.multi_chapter_id := 'ALL';
        registrationrequest.chapter_id := 'LUM';
    END initialize_registration_request;

    PROCEDURE getsysparmvalue (
        parm_name  IN VARCHAR2,
        parm_value OUT VARCHAR2
    ) IS
    BEGIN
        SELECT
            parameter_value
        INTO parm_value
        FROM
            valid_parameters
        WHERE
                parameter_code = parm_name
            AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate + 1);

    END getsysparmvalue;

    FUNCTION generate_new_id RETURN VARCHAR2 IS
        lv_new_id   VARCHAR2(100);
        lv_err_flag VARCHAR2(100);
        lv_err_msg  VARCHAR2(100);
    BEGIN
        don_std.generate_temp_id(new_temp_id => lv_new_id, err_flag => lv_err_flag, err_msg => lv_err_msg);

        dbms_output.put_line('New ID: ' || lv_new_id);
        dbms_output.put_line('Error Flag: ' || lv_err_flag);
        dbms_output.put_line('Error Message: ' || lv_err_msg);
        RETURN lv_new_id;
    END generate_new_id;

    FUNCTION getuspsid (
        p_city  IN VARCHAR2,
        p_state IN VARCHAR2,
        p_zip   IN VARCHAR2
    ) RETURN NUMBER IS
        v_usps_id NUMBER;
    BEGIN
        -- Assuming there is a table named USPS_TABLE with columns CITY, STATE, ZIP, and USPS_ID
        SELECT
            usps_id
        INTO v_usps_id
        FROM
            valid_city_state
        WHERE
                city = p_city
            AND state = p_state
            AND zip = p_zip;

        RETURN v_usps_id;
    EXCEPTION
        WHEN no_data_found THEN
            RETURN NULL; -- or handle as needed
            dbms_output.put_line('No data found');
        WHEN OTHERS THEN
            -- Log the error or handle it as needed
            RETURN NULL;
            dbms_output.put_line('Error: ' || sqlerrm);
    END getuspsid;

    PROCEDURE fill_donor_record IS
    BEGIN
        --initialize donor record
        donor_rec.donor_id := registrationrequest.donor_id;
        donor_rec.chapter_id := registrationrequest.multi_chapter_id;
        donor_rec.gender := registrationrequest.gender;
        donor_rec.date_of_birth := registrationrequest.date_of_birth;
        donor_rec.first_name := registrationrequest.first_name;
        donor_rec.middle_name := registrationrequest.middle_name;
        donor_rec.last_name := registrationrequest.last_name;
        donor_rec.last_name_suffix := registrationrequest.last_name_suffix;
        donor_rec.alias := registrationrequest.alias;
        donor_rec.blood_type := NULL;
        donor_rec.ethnic_group := registrationrequest.ethnic_group;
        donor_rec.alternate_id := registrationrequest.alternate_id;
        donor_rec.alternate_id_type := registrationrequest.alternate_id_type;
        donor_rec.height := registrationrequest.height;
        donor_rec.scan_id := registrationrequest.scan_id;
        donor_rec.donor_weight := registrationrequest.donor_weight;
        donor_rec.ssn := registrationrequest.ssn;
        donor_rec.life_donations := registrationrequest.lifetime_don;
        donor_rec.ytd_donations := registrationrequest.ytd_don;
        donor_rec.life_credit := registrationrequest.lifetime_cr;
        donor_rec.ytd_credit := registrationrequest.ytd_cr;
        -- last donation info
        donor_rec.last_unit_id := registrationrequest.last_unit_id;
        donor_rec.last_coll_date := registrationrequest.last_coll_date;
        donor_rec.last_don_type := registrationrequest.last_don_type;
        donor_rec.last_proc_code := registrationrequest.last_proc_code;
        -- db loggin info
        donor_rec.program_id := registrationrequest.program_id;
        donor_rec.insert_user := registrationrequest.user_id;
    END fill_donor_record;

    PROCEDURE fill_donor_picture IS
    BEGIN
        -- fill donor picture
        donor_picture_rec.donor_id := registrationrequest.donor_id;
        donor_picture_rec.insert_user := registrationrequest.user_id;
    END fill_donor_picture;

    PROCEDURE fill_donor_addresses IS
    BEGIN
        -- fill donor address
        donor_address_rec.chapter_id := registrationrequest.multi_chapter_ID;
        donor_address_rec.address_type := 'RES';
        donor_address_rec.donor_id := registrationrequest.donor_id;
        donor_address_rec.street_name := registrationrequest.street_name;
        donor_address_rec.SUITE_APT := registrationrequest.apt;
        donor_address_rec.h_area_code := registrationrequest.h_area_code;
        donor_address_rec.h_phone_no := registrationrequest.h_phone_no;
        donor_address_rec.d_area_code := registrationrequest.d_area_code;
        donor_address_rec.d_phone_no := registrationrequest.d_phone_no;
        donor_address_rec.extension := registrationrequest.extension;
        donor_address_rec.m_area_code := registrationrequest.m_area_code;
        donor_address_rec.m_phone_no := registrationrequest.m_phone_no;
        donor_address_rec.preferred_contact_flag := registrationrequest.preferred_contact_flag;
        donor_address_rec.email := registrationrequest.email;
        donor_address_rec.usps_id := registrationrequest.usps_id;
        donor_address_rec.program_id := registrationrequest.program_id;
    END fill_donor_addresses;

    -- fill donation record
    PROCEDURE fill_donation_record IS
    BEGIN
        donation_rec.transaction_id := registrationrequest.transaction_id;
        donation_rec.chapter_id := registrationrequest.chapter_id;
        donation_rec.drive_id := registrationrequest.drive_id;
        donation_rec.coll_date := registrationrequest.drive_date;
        donation_rec.set_id := registrationrequest.set_id;
        donation_rec.credit_count := registrationrequest.credit_count;
        donation_rec.donor_id := registrationrequest.donor_id;
        donation_rec.credit_sponsor := registrationrequest.alternate_sponsor_id;
        donation_rec.donation_type := registrationrequest.donation_type;
        donation_rec.procedure_code := registrationrequest.procedure_code;
        donation_rec.equip_type := registrationrequest.equipment_code;
        donation_rec.program_id := registrationrequest.program_id;
        donation_rec.insert_user := registrationrequest.user_id;
        donation_rec.lookup_id := registrationrequest.user_id;
    END fill_donation_record;

    -- fill online status record
    PROCEDURE fill_online_status_record IS
    BEGIN
        -- fill online status record
        online_status_rec.transaction_id := registrationrequest.transaction_id;
        online_status_rec.lookup_start := sysdate;
        online_status_rec.lookup_end := sysdate;
        online_status_rec.lkup_ovr_rsn := NULL;
        online_status_rec.lkup_updt_by := registrationrequest.user_id;
        online_status_rec.lkup_updt_time := sysdate;
        online_status_rec.donor_stopped_at := NULL;
        online_status_rec.donor_id := registrationrequest.donor_id;
        online_status_rec.drive_id := registrationrequest.drive_id;
        online_status_rec.drive_date := registrationrequest.drive_date;
        online_status_rec.donor_id_verified := registrationrequest.id_verified;
        online_status_rec.insert_user := registrationrequest.user_id;
        online_status_rec.status_flag := 'P';
    END fill_online_status_record;

BEGIN
    initialize_registration_request;
    getsysparmvalue('TBVH', lv_tbvh);
    dbms_output.put_line('TBVH: ' || lv_tbvh);
    IF lb_newdonor THEN
        registrationrequest.is_new := TRUE;
        registrationrequest.donor_id := generate_new_id();
    END IF;

    registrationrequest.usps_id := getuspsid(registrationrequest.city, registrationrequest.state, registrationrequest.zip);

    fill_donor_record;
    fill_donor_picture;
    fill_donor_addresses;
    fill_donation_record;
    fill_online_status_record;
    INSERT INTO donors VALUES donor_rec;

    INSERT INTO donor_pictures VALUES donor_picture_rec;


    DON_STD.INSERT_MALE_FEMALE_INTER(PL_DONOR=> registrationrequest.DONOR_ID,
                            PL_CHAPTER_ID=>registrationrequest.multi_chapter_id/*VARCHAR2*/,
                            PL_GENDER=>registrationrequest.gender/*VARCHAR2*/,
                            PL_TRANS_ID=>registrationrequest.transaction_id/*VARCHAR2*/,
                            PL_PROGRAM_ID=>registrationrequest.program_id/*VARCHAR2*/,
                            PL_USER_ID=>registrationrequest.user_id/*VARCHAR2*/,
                            PL_OUT=>lv_status/*VARCHAR2*/);

    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);  

    IF lv_status = 'OK' THEN
        INSERT INTO donor_addresses VALUES donor_address_rec;

        INSERT INTO donations VALUES donation_rec;

        INSERT INTO online_status VALUES online_status_rec; 
    END IF;
                             
END;
