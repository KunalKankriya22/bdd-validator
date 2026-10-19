# BAGS — Bag Check-In (Form: MCIBAGS)

## What Is This Screen?

The Bag Check-In screen is where lab technicians record information about physical blood bags received from blood drives. It tracks the bag itself — not the blood inside it. The technician records what type of bag it is, what lot it came from, and what temperature it arrived at.

This is the second step in the Material Check-In process, after the initial donor/unit check-in on the DSCE screen.

---

## Screen Identity

| Property | Value |
|---|---|
| Menu Keyword | BAGS |
| Form File | mcibags_fmb.xml |
| Screen Title | BAGS: Bag Check-In |
| Module | Lab/Distribution |
| Sub-Module | Master Codes & Configuration |
| User Guide | Chapter 18, Section 18.2.2 (pages 1070–1074) |
| Access | General Check-In Functions menu, item 2 |

---

## What Can a User Do Here?

1. Start a new batch or continue an existing one
2. Record the receiving temperature (min and max) for the batch
3. Scan or manually enter each blood bag's unit ID
4. Scan or enter the bag catalog number
5. Scan or enter the lot number (this triggers the save)
6. View all units already in the batch (CTRL+F3)
7. Repeat for every bag in the batch

---

## Fields on the Screen

### Batch Header Area

| Field | Type | Required? | Notes |
|---|---|---|---|
| Batch ID | Text (max 14 chars) | No — auto-generates if left blank | Leave blank for a new batch. Pick from dropdown for an existing batch. Only non-QC'd batches appear in the dropdown. Format: MMDDYY-CB#### |
| Min Temp | Number (°C) | Yes — enforced by trigger | Minimum receipt temperature in Celsius |
| Max Temp | Number (°C) | Yes — enforced by trigger | Maximum receipt temperature in Celsius. Auto-defaults to 37.5°C if left blank |

### Unit Detail Area (grid with 11 rows visible)

| Field | Type | Required? | Notes |
|---|---|---|---|
| Seq# | Number | Auto-filled, not editable | Sequence number, auto-calculated based on units already in the batch |
| Unit ID (scan) | Text (max 16 chars) | Yes — enforced by trigger | Scan the barcode or type 'M' for manual entry. This is the scan input field |
| Unit ID (display) | Text (max 15 chars) | Auto-filled after scan | Shows the parsed unit ID after scanning |
| Check Digit | Text (max 2 chars) | Auto-filled, not editable | Check digit extracted from the unit ID |
| Catalog No. (scan) | Text (max 30 chars) | Yes — enforced by trigger | Scan the catalog barcode or type 'M' for manual entry. Supports ISBT concatenated catalog+lot scan |
| Catalog No. (display) | Text (max 15 chars) | Yes — enforced by trigger | Validated catalog number. Can also be picked from dropdown (VALID_CATALOGS table) |
| Drive ID | Text (max 6 chars) | Auto-filled, not editable | Automatically shows the drive where the blood was collected |
| Drive Name | Text (max 50 chars) | Auto-filled, not editable | Automatically shows the drive site name |
| Lot Number (scan) | Text (max 30 chars) | Yes — enforced by trigger | Scan lot barcode or type 'M' for manual entry |
| Lot Number (display) | Text (max 30 chars) | Yes — enforced by trigger | Validated lot number. Can be picked from dropdown (VALID_LOTS table, filtered by selected catalog) |
| CUE | Text (max 50 chars) | Auto-filled, not editable | Shows the Confidential Unit Exclusion status: OK, NFT, Ambiguous, Autologous, Therapeutic, No CUE, or N/A |

### Quick Summary

| Category | Fields |
|---|---|
| Must enter | Min Temp, Max Temp (defaults to 37.5), Unit ID, Catalog No., Lot Number |
| Optional | Batch ID (auto-generates if blank) |
| Auto-filled (display only) | Seq#, Drive ID, Drive Name, CUE, Check Digit |

---

## Step-by-Step Workflow

### Normal Processing

1. Open the screen from the General Check-In Functions menu or type keyword `BAGS`
2. Optionally enter a Batch ID to continue an existing batch, or leave blank for a new one
3. Enter the Min Temp (receiving temperature)
4. Enter the Max Temp (or press Enter to accept default of 37.5°C)
5. Scan the blood bag's unit ID barcode (or type 'M' for manual entry)
6. The system automatically shows Drive ID, Drive Name, and CUE status
7. Scan the catalog number barcode (or type 'M' for manual, then pick from dropdown)
8. Scan the lot number barcode (or type 'M' for manual, then pick from dropdown)
9. Pressing Enter after lot number **saves that unit immediately** (line-by-line commit)
10. Cursor moves down to the next row — repeat from step 5 for more units
11. Press CTRL+F3 to view all units in the current batch
12. Press F8 to exit when done

### What Happens When You Save Each Unit

- If this is a new batch, the system creates a Batch ID (format: MMDDYY-CB####)
- A BATCH_INPUTS record is created with the batch info and temperatures
- If the unit was already registered in Donor (DSCE screen), the existing UNITS record is **updated** with bag info (warehouse, batch, catalog, lot, bag check-in date)
- If the unit is brand new (not previously checked in), a new UNITS record is **inserted**
- If tubes were already checked in separately, the tube data gets merged into the UNITS record and removed from TEMP_UNITS
- The unit gets assigned to the user's warehouse location
- An audit trail record is created automatically in UNITS_AUDIT

---

## Warnings and Interdictions

The system checks several conditions and may show warnings or place interdictions (flags that block further processing).

| Condition | What the System Does |
|---|---|
| Expired lot number | Places a **CBEX** interdiction on the unit |
| Max temperature > 37.5°C | Places a **CMT** interdiction when the component is defined |
| Bleed time is slow (between slow and max threshold) | Shows a warning. May place a **BLFA** interdiction based on product type |
| Bleed time exceeds maximum | Shows a warning. Places a **BLFA** interdiction |
| CUE is NFT, Ambiguous, No CUE, or Therapeutic | Popup: "Remove this bag from further component production!" — user presses Y to continue |
| Unit ID already has a batch assigned | Error: unit has already been checked in |
| Batch is locked by another user | Error: batch is in use in another session |
| Max temp less than Min temp | Error: temperatures are invalid |

---

## Limitations and Rules

- **Batch locking:** When you open a batch, it gets locked. No one else can access it in BAGS or QC (QCCHK) until you exit
- **Sequential check-in:** If your chapter requires it (seq_checkin_flag = Y), the unit must go through DSCE first before bag check-in
- **ISBT vs Codabar:** Only one barcode format is allowed based on your chapter's ISBT start date. You cannot mix ISBT and Codabar units
- **ISBT bags cannot be checked in for Codabar units** (and the other way around)
- **Only non-QC'd batches** appear in the Batch ID dropdown. You cannot add units to a batch that has already been QC'd

---

## Database Tables Used

| Table | How It Is Used |
|---|---|
| UNITS | Main table — stores all unit and bag data. Records are inserted or updated here |
| BATCH_INPUTS | Tracks batches — created when a new batch starts, locked during processing |
| VALID_CATALOGS | Validates that the entered catalog number is active and belongs to the user's chapter |
| VALID_LOTS | Validates that the entered lot number is active for the selected catalog |
| VALID_COLLECTION_AGENCIES | Used for manual unit entry to validate collection center IDs |
| CHAPTERS | Reads chapter configuration: ISBT vs Codabar mode, sequential check-in flag |
| TEMP_UNITS | If tubes were checked in before bags, tube data is read from here and merged into UNITS, then deleted |
| DRIVES_LAB | Looks up drive info (drive ID) for the scanned unit |
| GROUP_SITES | Looks up drive site name |
| UNIT_ATTRIBUTES | Checks if the unit has a pheresis (PHER) attribute to skip bleed time warnings |
| UNITS_AUDIT | Audit trail — automatically populated by a database trigger on every UNITS insert |

---

## Dropdowns (LOVs) and Where Their Data Comes From

| Dropdown | Source Table | What It Shows | Filter |
|---|---|---|---|
| Batch ID | BATCH_INPUTS + UNITS | Existing batch IDs | Only CB-type batches, not QC'd, same warehouse, same chapter, has non-QC'd units |
| Catalog Number | VALID_CATALOGS | Valid catalog numbers | Same chapter, currently active (between eff_date and term_date) |
| Lot Number | VALID_LOTS | Valid lot numbers | Filtered by the selected catalog number, same chapter, currently active |
| Collection ID (manual entry) | VALID_COLLECTION_AGENCIES | Collection center codes and names | Same chapter, currently active |

---

## Popup Windows

| Window | Title | When It Appears |
|---|---|---|
| Units in this Batch | "Units in this Batch" | Press CTRL+F3 — shows Unit ID, Collection Date, Drive ID, Drive Name for all units in the current batch |
| Manual Unit Entry | "Manual Entry of Unit ID" | When user types 'M' instead of scanning, to enter unit ID parts manually (collection ID, year, serial number) |
| CUE Warning | "Message" | When a unit's CUE is NFT, Ambiguous, No CUE, or Therapeutic — warns to remove from production |

---

## Where This Screen Fits in the Workflow

```
Step 1: DSCE (Check-In Details)
         Enter donor card data, bleed times, attribute codes
              ↓
Step 2: BAGS (Bag Check-In)  ← THIS SCREEN
         Enter bag catalog, lot number, receiving temperature
              ↓
Step 3: TUBES (Tube Check-In)
         Record receipt of test tubes (red top and purple top)
              ↓
Step 4: QCCHK (QC of Check-In Batch)
         Supervisor reviews and approves the batch
              ↓
Step 5: Unit is ready for labeling and further processing
```

Note: BAGS and TUBES can be done in any order. Tubes can be checked in at any time. But DSCE should come first (if sequential check-in is turned on), and QCCHK always comes last.

---

## Key Business Logic in the Code

### Batch ID Generation
New batch IDs are created automatically using the format `MMDDYY-CB####` where the date is timezone-aware (converted to the chapter's local time) and the sequence number comes from the `generate_sequence` function.

### Unit ID Validation
When a unit ID is scanned, the system:
1. Parses the barcode (ISBT or Codabar format)
2. Checks if the unit already exists in the UNITS table
3. If yes and already has a batch — shows error (already checked in)
4. If yes but no batch — proceeds to update with bag data
5. If no — creates a new UNITS record (only if sequential check-in is off)
6. Looks up drive info and checks bleed times against chapter thresholds
7. Checks CUE status and warns if unfavorable

### Catalog and Lot Validation
- Catalog numbers are validated against the VALID_CATALOGS table for the user's chapter
- The scan field supports ISBT data identifiers: `=)` for container/catalog ID, `&)` for lot number
- Concatenated scans (catalog + lot in one barcode) are automatically split
- Lot numbers are validated against VALID_LOTS filtered by the selected catalog
- If a lot is expired (past its term_date), the system still allows check-in but places a CBEX interdiction

### Temperature Handling
- Max Temp defaults to 37.5°C if the user doesn't enter a value
- Min Temp must be less than or equal to Max Temp
- Both are stored in the BATCH_INPUTS record
- Temperature values are shared across all units in the same batch

### Timezone Awareness
The system uses `Lifetrack_timezone_convert` to convert server time to the chapter's local time. This affects:
- The batch ID date portion
- The bag_check_in_dats timestamp on UNITS records
- Date comparisons for lot expiration

---

## Sources

- Obsidian Vault: `screens/Lab-Distribution/mcibags.md`
- Oracle Forms XML: `Lab_Dist/forms_xml/mcibags_fmb.xml` (346 lines, full analysis)
- User Guide PDF: Chapter 18, Section 18.2.2, pages 1070–1074
- Database Triggers: `sbcsys/triggers/UNITS_BEFORE_INSERT.sql`, `BATCH_INPUTS_BI.sql`
