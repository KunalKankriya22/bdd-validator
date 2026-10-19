# Business Rules

## Core Domain Concepts

### Blood Center Hierarchy
```
Organization
  ├── Chapters (geographic regions)
  │   ├── Warehouses (storage facilities)
  │   ├── Lab Codes (laboratory identifiers)
  │   └── Users (staff members)
  ├── Groups (user permission groups)
  └── Access Levels (authorization tiers)
```

## Donor Management Rules

### Donor Registration
1. **Unique Identification**
   - Each donor must have a unique donor ID
   - Donor ID follows configured sequence number pattern
   - SSN/ID verification is required based on chapter settings

2. **Eligibility Screening**
   - Donors must pass health screening questionnaire
   - Age requirements: Typically 16-76 (varies by chapter)
   - Weight minimums apply based on donation type
   - Travel history restrictions enforced

3. **Donor Status**
   - **Active**: Eligible to donate
   - **Deferred**: Temporarily ineligible (time-based)
   - **Blocked**: Permanently ineligible
   - **Interdicted**: Administratively blocked

### Donation Rules
1. **Donation Frequency**
   - Whole blood: Minimum 56 days between donations
   - Platelet: Minimum 7 days, maximum 24 times/year
   - Double red cell: Minimum 112 days
   - Plasma: Varies by chapter configuration

2. **Max Donations**
   - Configured per donation type in "Define Max Donations" table
   - Enforced based on rolling time periods
   - Overrides require special authorization

3. **Procedure Exclusions**
   - Certain procedures exclude donors from specific donation types
   - Defined in "Define Procedure Exclusions" table
   - Time-based exclusions enforced automatically

### Donor History
- All donor interactions must be logged
- Historical donations tracked for lifetime
- Eligibility changes must be audited
- Consent tracking required for all procedures

## Laboratory Rules

### Test Processing
1. **Test Configuration**
   - Tests defined per chapter
   - Required tests vary by product type
   - Test results must fall within defined ranges
   - Invalid results require review

2. **Test Validation**
   - All tests require minimum/maximum value constraints
   - Configured in "Define Physical Findings Values" table
   - Out-of-range results flagged for review
   - Positive results trigger notification workflow

3. **Instrument Interface**
   - Lab results can be manually entered or interface-imported
   - Interface imports require validation before acceptance
   - Error records tracked in "Manage Errors" functionality
   - Raw data retained for audit

### Lab Result Workflow
```
Sample Collection → Testing → Data Entry/Import → Validation → Review (if needed) → Finalization
```

## Distribution Rules

### Product Management
1. **Product Types**
   - Each product has specific storage requirements
   - Expiration dates enforced based on product type
   - Temperature monitoring required
   - Antigen testing results linked to product

2. **Product Distribution**
   - Products allocated based on ABO/Rh compatibility
   - Rare antigen matching when required
   - First-expired, first-out (FEFO) logic applied
   - Crossmatch requirements enforced

3. **Return Processing**
   - Returns must have valid reason codes
   - Return reasons configured in validation tables
   - Temperature integrity verified before re-inventory
   - Expired products cannot be returned to inventory

### Box Capacity Rules
- Configured in "Box Capacity" table
- Defines product quantity limits per container type
- Enforced during packing operations
- Varies by product type

## User Management Rules

### User Access
1. **User Attributes**
   - Users assigned to one or more chapters
   - Access level determines function availability
   - Group membership provides additional permissions
   - Effective/termination dates control account lifecycle

2. **Access Levels**
   - Hierarchical access model (1-10)
   - Higher levels inherit lower level permissions
   - System admin level (10) has unrestricted access
   - Level 0 = read-only access

3. **User Groups**
   - Users can belong to multiple groups
   - Groups grant access to specific functions
   - Group membership can be chapter-specific
   - Inactive groups immediately revoke access

### Password Policies
1. **Password Requirements** (configurable)
   - Minimum length (default: 8 characters)
   - Complexity requirements (uppercase, lowercase, numbers, symbols)
   - Password history (prevent reuse)
   - Expiration period (e.g., 90 days)

2. **Account Security**
   - Failed login attempts trigger lockout
   - Lockout duration configurable
   - Session timeout enforced
   - Concurrent session limits

3. **Password Reset**
   - Self-service reset via email
   - Security questions required
   - Temporary passwords expire in 24 hours
   - Admin reset available for locked accounts

## Validation Table Rules

### Common Validation Tables
Shared across all modules (donor, lab, distribution):
- **EMF Processes**: Manufacturing process mappings
- **Daylight Savings**: Time zone handling rules
- **External BC Data Translate**: External barcode translation

### Restricted Validation Tables
Chapter-specific configuration:
- Each chapter can have unique validation data
- Restricted tables require chapter context
- Changes affect only selected chapter(s)
- Some tables allow global defaults with chapter overrides

### Master Code Tables
1. **Code Types**
   - Donor, Lab, and Distribution master codes
   - Each code type has specific attributes
   - Active/inactive status controls usage
   - Codes can be chapter-restricted

2. **Code Management**
   - Codes cannot be deleted if in use
   - Inactivation hides from selection
   - Historical data retains inactive code references
   - Reactivation allowed if business rules permit

## Error Code Management

### Error Code Categories
1. **Donor Errors**: Donation processing errors
2. **Lab Errors**: Testing and result errors
3. **Distribution Errors**: Product handling errors

### Error Code Behavior
- Each error has severity level (Warning, Error, Critical)
- Blocking errors prevent transaction completion
- Warning errors allow override with authorization
- All errors logged with user/timestamp

## Interdiction Rules

### Donor Interdiction
1. **Interdiction Assignment**
   - Donors can be interdicted based on specific criteria
   - Interdiction classes define eligibility restrictions
   - Effective dates control when interdiction applies
   - Permanent or temporary interdictions supported

2. **Interdiction Override**
   - Overrides require appropriate authorization level
   - Override reasons must be documented
   - Temporary overrides have expiration dates
   - All overrides audited

### User Interdiction
- User interdiction classes restrict function access
- Applied in addition to normal access controls
- Used for disciplinary or compliance purposes

## Date Validation Rules

### Effective/Termination Dates
1. **User Accounts**
   - Effective date: First day user can access system
   - Termination date: Last day of access
   - Account disabled automatically after termination
   - Future effective dates allow pre-provisioning

2. **Configuration Records**
   - Most validation tables support effective dating
   - Future-dated records become active automatically
   - Historical records maintained for audit
   - Overlapping date ranges prevented

### Date Constraints
- Termination date must be ≥ effective date
- Cannot set dates more than 10 years in past/future (configurable)
- Date format strictly enforced (YYYY-MM-DD)
- Null termination date = no expiration

## Sequence Number Rules

### Application Sequence Numbers
1. **Purpose**
   - Generate unique identifiers for various entities
   - Examples: Donor IDs, Unit numbers, Transaction IDs

2. **Configuration**
   - Prefix: Optional text before number
   - Starting number: Initial value
   - Current number: Last assigned value
   - Increment: Step size (usually 1)
   - Reset cycle: Never, Daily, Monthly, Yearly

3. **Reset Cycles**
   - **Never**: Continuous increment
   - **Daily**: Resets at midnight
   - **Monthly**: Resets on 1st of month
   - **Yearly**: Resets on January 1st

## Consent Management

### Donor Procedure Consent
1. **Consent Mapping**
   - Each donation procedure requires specific consents
   - Configured in "Donor Procedure Consent Definition"
   - Consent text and version tracked
   - Consent must be current for procedure to proceed

2. **Consent Tracking**
   - Donor consent recorded with timestamp
   - Consent version tracked for compliance
   - Outdated consents require re-consent
   - Withdrawal of consent prevents future procedures

## Report Administration

### Report Parameters
1. **Parameter Types**
   - Date ranges
   - Chapter selection
   - Product types
   - Custom filters

2. **Report Access**
   - Reports restricted by user access level
   - Group membership may grant report access
   - Chapter-level security applied
   - Sensitive reports require elevated privileges

## Chapter/Institution Rules

### Chapter Management
1. **Chapter Attributes**
   - Unique chapter ID and code
   - Geographic region
   - Active/inactive status
   - Configuration overrides

2. **Multi-Chapter Operations**
   - Users can access multiple chapters
   - Default chapter set per user
   - Chapter switching updates context
   - Some operations cross-chapter capable

### Institution Relationships
- Institutions (hospitals, clinics) linked to chapters
- Product distribution targets
- Donor drive locations
- Billing entities

## Validation Edge Cases

### Name Validation
- **Associate Nickname to Name** table handles name variations
- Common misspellings mapped to standard names
- Helps prevent duplicate donor registrations

### Physical Findings
- Age-dependent normal ranges
- Gender-specific constraints
- Procedure-specific requirements

### ABO Spread
- Blood type distribution tracking
- Sponsor/drive-specific ABO requirements
- Balancing logic for blood supply

## Audit Requirements

### Required Audit Fields
All transactions must capture:
- User who performed action
- Timestamp of action
- Chapter context
- Before/after values for updates
- IP address (for security-sensitive actions)

### Retention Rules
- Active records: Retained indefinitely
- Historical records: Minimum 7 years
- Audit logs: Minimum 3 years
- Donor records: Lifetime retention

## Data Integrity Rules

### Referential Integrity
- Cannot delete chapters with active users
- Cannot delete codes in use
- Cannot delete donors with donation history
- Inactivation preferred over deletion

### Consistency Rules
- ABO/Rh must be valid combination
- Product codes must match valid product types
- Test codes must exist in lab master codes
- All foreign keys must reference existing records

## Business Rule Validation Checklist

Before implementing any feature:
- [ ] Validate all required fields
- [ ] Enforce date constraints
- [ ] Check user authorization
- [ ] Verify chapter context
- [ ] Apply validation table rules
- [ ] Handle interdictions
- [ ] Log audit trail
- [ ] Provide user feedback
- [ ] Handle edge cases
- [ ] Test error scenarios
