---
module: Donor
sub_module: "Donor Registration & Data Entry"
title: "Deferral Audit"
mnemonic: dridfaud
tags:
  - screen
  - donor
  - donor-registration-and-data-entry
---

# dridfaud — Deferral Audit

**Module:** [[Donor]] > [[Donor Registration & Data Entry]]

## Database Tables

- [[DONATION_INTERDICTIONS]]
- [[HEALTH_HISTORY]]
- [[HEALTH_HISTORY_TEMPLATE]]
- [[PHYSICAL_FINDINGS]]

## Dropdown/LOV Sources
Values in dropdowns on this screen come from:

- [[HEALTH_HISTORY_TEMPLATE]]
- [[PHYSICAL_FINDINGS_TEMPLATE]]
- [[VALID_DONATION_TYPES]]
- [[VALID_HH_ANSWERS]]
- [[VALID_HH_COMMENTS]]
- [[VALID_HH_RES_GROUPS]]
- [[VALID_INTERDICTIONS]]
- [[VALID_MASTER_CODES]]
- [[VALID_PHYSICAL_RULES]]
- [[VALID_PROC_CODES]]

## Opens/Navigates To

- [[dpwaaddr]]

## Called By
These screens open this form:

- [[drqnodef]]
