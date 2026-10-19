ALTER TABLE emf_source_process_adt MODIFY (
    old_value VARCHAR2(2000),
    new_value VARCHAR2(2000)
);

ALTER TABLE emf_target_process_adt MODIFY (
    old_value VARCHAR2(500),
    new_value VARCHAR2(500)
);

ALTER TABLE emf_process_mapping_adt MODIFY (
    old_value VARCHAR2(2000),
    new_value VARCHAR2(2000)
);