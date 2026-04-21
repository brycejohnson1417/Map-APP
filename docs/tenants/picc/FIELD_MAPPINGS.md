# PICC Field Mappings

## Purpose
This file defines how PICC's external systems map into the generic Map App Harness runtime.

The machine-readable copy of this document lives at:
- `tenants/picc/field-mappings.json`

These mappings are confirmed from:
- legacy source code in `Picc-web-app`
- the live Notion master-list schema queried on 2026-04-16

## Source systems
- Notion master list CRM
- Nabis orders and retailers
- legacy Neon database models and read models

## Confirmed Notion master-list mappings

### Account identity and address
- `Dispensary Name` (`title`) -> `account.name`
- `Licensed Location ID` (`rich_text`) -> `account_identity.licensed_location_id`
- `Nabis Retailer ID` (`rich_text`) -> `account_identity.nabis_retailer_id`
- `License Number` (`rich_text`) -> `account.license_number`
- `Address 1` (`rich_text`) -> `account.address_1`
- `City` (`rich_text`) -> `account.city`
- `Zipcode` (`rich_text`) -> `account.zipcode`
- `Full Address` (`rich_text`) -> `account.full_address`
- `Map Location` (`place`) -> map point / geospatial seed

### Runtime account state
- `Account Status` (`status`) -> `account.status`
- `Rep` (`people`) -> primary rep assignment
- `Account Manager` (`people`) -> account manager assignment
- `Referral Source` (`select`) -> `account.referral_source`
- `Vendor Day Status` (`status`) -> `account.vendor_day_status`
- `Follow Up Date` (`date`) -> `account.follow_up_date`
- `Follow Up Needed` (`checkbox`) -> `account.follow_up_needed`
- `Follow Up Reason` (`rich_text`) -> `account.follow_up_reason`
- `Last Contacted` (`date`) -> `account.last_contacted_at`
- `Days Overdue` (`formula`) -> overdue read-model signal

### Order- and sample-derived display fields
- `Last Order Amount` (`rollup`) -> local order aggregate display field
- `Last Order Date` (`rollup`) -> local order aggregate display field
- `Last Delivery Date` (`rollup`) -> local delivery aggregate display field
- `Last Sample Order Date` (`rollup`) -> local sample aggregate display field
- `Customer Since` (`rollup`) -> local customer-lifecycle display field

### Contact and operational fields
- `Contact` (`rich_text`) -> primary contact display name
- `Contact Email` (`email`) -> primary contact email
- `Contact Phone` (`phone_number`) -> primary contact phone
- `PICC Credit Status` (`rollup`) -> tenant-specific credit status display
- `PPP Status` (`status`) -> tenant-specific program status display
- `Headset Connection` (`status`) -> tenant-specific display field

## Confirmed legacy code candidate handling
Legacy territory and detail services also tolerated these aliases:
- rep candidates: `Rep`, `PICC Rep`, `Sales Rep`
- referral candidates: `Referral Source`, `Lead Source`, `Source`
- sample-order candidates: `Last Sample Order Date`, `Sample Order Date`, `Last Sample Date`
- sample-delivery candidates: `Last Sample Delivery Date`, `Sample Delivery Date`, `Last Sample Delivered Date`, `Sample Delivered Date`
- order-date candidates: `Last Order Date`, `Most Recent Order Date`
- manager candidates: `Account Manager`, `Manager`

## Confirmed Nabis mappings
- `licensedLocationId` -> deterministic account identity
- `retailerId` / `externalRetailerId` -> deterministic retailer identity
- `siteLicenseNumber` -> `account.license_number`
- `name` / `doingBusinessAs` -> retailer/account display fields
- `createdDate` / `createdTimestamp` -> `order.created_at`
- `deliveryDate` -> `order.delivery_date`
- `soldBy` -> normalized rep attribution
- `orderTotal` / `orderSubtotal` / `wholesaleValue` -> local revenue aggregates

## Confirmed legacy model mappings
- `OrganizationWorkspace` -> `organization`
- `Membership` -> `organization_member`
- `Account` -> `account`
- `Contact` -> `contact`
- `ActivityLog` -> `activity`
- `NabisRetailer` -> normalized retailer table
- `NabisOrder` -> normalized order table
- `AccountIdentityMapping` -> `account_identity`
- `Territory` -> `territory_boundary`
- `TerritoryMarker` -> `territory_marker`
- `AuditEvent` -> `audit_event`

## Important migration note
The legacy app split state across at least two organization ids:
- `picc_company_workspace` held the shared company workspace records
- `org_picc_demo` held territory read-model and queue artifacts

The migration must collapse these into one coherent tenant runtime instead of preserving the split.
