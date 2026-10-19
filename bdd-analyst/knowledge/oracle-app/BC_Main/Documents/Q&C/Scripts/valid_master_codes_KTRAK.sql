DELETE FROM valid_master_codes WHERE code_type = 'KTRAK';

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'ACODE',
    '1',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('02-FEB-12 21.18.36', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'DNAME',
    'qcdemo',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('02-FEB-12 21.57.40', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL

);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'KTREF',
    '5',
    0,
    0,
    0,
    0,
    TO_DATE('21-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('21-FEB-12 17.12.29', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'KTURL',
    'https://qc9.wellsky.com/qc1',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('02-FEB-12 21.57.40', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'RCMD',
    '/api/rcmd.asp?i=',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('02-FEB-12 21.57.40', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'SSL',
    'Y',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('03-JUN-24 15.29.53', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

INSERT INTO valid_master_codes (
    code_type,
    code,
    description,
    numeral_value,
    sort_sequence_1,
    sort_sequence_2,
    sort_sequence_3,
    eff_date,
    term_date,
    program_id,
    insert_date,
    insert_user,
    audit_key
) VALUES (
    'KTRAK',
    'WLTLC',
    'file:/apps/product/19.0.0/admin/BCDEV/wallet/tde',
    0,
    0,
    0,
    0,
    TO_DATE('02-FEB-12 00.00.00', 'DD-MON-RR HH24.MI.SS'),
    NULL,
    'VDICODES',
    TO_DATE('03-JUN-24 18.08.38', 'DD-MON-RR HH24.MI.SS'),
    'MANUAL',
    NULL
);

COMMIT;