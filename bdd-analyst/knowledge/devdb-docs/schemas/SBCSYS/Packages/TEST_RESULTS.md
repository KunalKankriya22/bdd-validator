---
tags:
  - package
  - SBCSYS
---
# TEST_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE test_results IS
/* --
--	This function will be called by instrument update programs
--	to update data in utrs or unit_test_base and
--	schedule additional tests according to valid_test_results
--    update date :04-18-11
--    version     :02 replace user by lt_user_session.get_userid -- by Hussein
--    version     :03 some debug message was removed, ronum=1 was added in A50
--    version     :04 Kishore (12/09/2015) - SCR 151894 - Display debug messages based on
--                 value in the DEBUG_CONTROLS table.
--      Version:01 for resetting
--      Version: 02   for adding all the six confirmatory tests By edwin
--      Version: 03 07/21/2018 MLT 526 (QCRE placement query modified) -- VO3
--      Version: 04 09/13/2018  MLT 803/804, call the new confirmatory package
--      Version: 05 10/09/18     To place QCRE code for confirmatory tests      - Edwin
--      Version: 06 10/16/18     Changes to QCRE code related for confirmatory tests - Edwin
--      Version: 07 10/16/18     Not able to remove the QCRE for confirmatory, so tweaked the code - Edwin
--      Version: 08 04/13/20 MLT- 2866/3149 (not scheduling test correctly for multiple chapters cases)
--      Version: 09 02/23/22 MLT- 4912 (Mergin from 2018R2_SP5 and 2019_R3)
--      Version: 10 05/19/22 MLT-5152 (to avoid putting WAD chapter if the unit is not checked in )

--
*/
FUNCTION update_auto_test (	ax_unit_id varchar2,
				ax_test_id varchar2,
				ax_well_number varchar2,
				ax_absorbance varchar2,
				ax_ratio varchar2,
				ax_result_status varchar2,
				ax_tb_id varchar2,
				ax_program_id varchar2,
				ax_result_dats date DEFAULT NULL)
							return VARCHAR2 ;
--
--	For manual test update, this routine is called after result update.
--	It schedules additional tests and confirmatory tests
--	Also creates interdictions and attributes according to valid_test_results
--
FUNCTION update_inter 	( 	ax_unit_id varchar2,
				ax_coll_date date,
				ax_chapter_id varchar2,
				ax_test_id varchar2,
				ax_result_status varchar2,
				ax_program_id varchar2 ) return VARCHAR2 ;
--
--	Called AFTER voiding a result in utrs or unit_test_base .
--	If reactive result, current interdictions due to this test are deleted
--	Interdictions and attributes are recomputed as per new status of the
--	voided result. Additional tests and confirmatory test are scheduled
--	according to valid_test_results
--
FUNCTION unit_void 		( 	ax_unit_id varchar2,
					ax_coll_date date,
					ax_chapter_id varchar2,
					ax_test_id varchar2,
					ax_result_status varchar2,	/* old result */
					ax_program_id varchar2 )	return VARCHAR2 ;
--
--	The result must be edited in utrs or unit_test_base first.
--	This will delete current interdictions due to this test and recompute
--	interdictions, attributes  etc.
--
FUNCTION unit_edit 		(ax_unit_id varchar2,
				ax_coll_date date,
				ax_chapter_id varchar2,
				ax_test_id varchar2,
				ax_old_result_status varchar2,
				ax_new_result_status varchar2,
				ax_program_id varchar2 ) return VARCHAR2 ;
--
--	This function is called by donor interface program to check for
--	result discrepancy in case of ABORH and antigen test results
--
FUNCTION discrepancy	( ax_unit_id varchar2,
			ax_coll_date date,
			ax_chapter_id varchar2,
			ax_test_id varchar2,
			ax_don_result_status varchar2,
			ax_program_id varchar2 )	return VARCHAR2 ;
end test_results;
```
