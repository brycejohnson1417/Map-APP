import "server-only";

import type {
  AccountActivity,
  AccountContact,
  AccountIdentity,
  AccountOrder,
  AccountRuntimeDetail,
} from "@/lib/domain/runtime";
import { findRuntimeOrganization, runtimeExactCount, runtimeRestRequest } from "@/lib/application/runtime/runtime-rest";
import { AuditEventRepository } from "@/lib/infrastructure/supabase/audit-event-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const auditEvents = new AuditEventRepository();

interface AccountRow {
  id: string;
  name: string;
  legal_name: string | null;
  display_name: string | null;
  account_status: string | null;
  lead_status: string | null;
  referral_source: string | null;
  vendor_day_status: string | null;
  licensed_location_id: string | null;
  license_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  sales_rep_names: string[] | null;
  account_manager_names: string[] | null;
  last_contacted_at: string | null;
  last_sample_order_date: string | null;
  last_sample_delivery_date: string | null;
  last_order_date: string | null;
  customer_since_date: string | null;
  crm_updated_at: string | null;
  external_updated_at: string | null;
  custom_fields: Record<string, unknown> | null;
}

interface IdentityRow {
  id: string;
  provider: AccountIdentity["provider"];
  external_entity_type: string;
  external_id: string;
  match_method: string;
  match_confidence: number | string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ContactRow {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ActivityRow {
  id: string;
  contact_id: string | null;
  activity_type: string;
  summary: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface OrderRow {
  id: string;
  external_order_id: string;
  order_number: string | null;
  status: string | null;
  payment_status: string | null;
  order_total: number | string | null;
  order_created_at: string | null;
  delivery_date: string | null;
  sales_rep_name: string | null;
  is_internal_transfer: boolean | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapIdentity(row: IdentityRow): AccountIdentity {
  return {
    id: row.id,
    provider: row.provider,
    externalEntityType: row.external_entity_type,
    externalId: row.external_id,
    matchMethod: row.match_method,
    matchConfidence: toNumber(row.match_confidence) ?? 0,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: ContactRow): AccountContact {
  return {
    id: row.id,
    fullName: row.full_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    role: row.role,
    customFields: row.custom_fields ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): AccountActivity {
  return {
    id: row.id,
    contactId: row.contact_id,
    activityType: row.activity_type,
    summary: row.summary,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row: OrderRow): AccountOrder {
  return {
    id: row.id,
    externalOrderId: row.external_order_id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    orderTotal: toNumber(row.order_total),
    orderCreatedAt: row.order_created_at,
    deliveryDate: row.delivery_date,
    salesRepName: row.sales_rep_name,
    isInternalTransfer: Boolean(row.is_internal_transfer),
  };
}

function mapAccount(row: AccountRow): AccountRuntimeDetail["account"] {
  const daysOverdue = row.custom_fields?.daysOverdue;

  return {
    id: row.id,
    name: row.display_name ?? row.name,
    legalName: row.legal_name,
    status: row.account_status,
    leadStatus: row.lead_status,
    referralSource: row.referral_source,
    vendorDayStatus: row.vendor_day_status,
    licensedLocationId: row.licensed_location_id,
    licenseNumber: row.license_number,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    salesRepNames: row.sales_rep_names ?? [],
    accountManagerNames: row.account_manager_names ?? [],
    lastContactedAt: row.last_contacted_at,
    lastOrderDate: row.last_order_date,
    lastSampleOrderDate: row.last_sample_order_date,
    lastSampleDeliveryDate: row.last_sample_delivery_date,
    customerSinceDate: row.customer_since_date,
    crmUpdatedAt: row.crm_updated_at,
    externalUpdatedAt: row.external_updated_at,
    customFields: row.custom_fields ?? {},
    daysOverdue: typeof daysOverdue === "number" ? daysOverdue : null,
  };
}

async function fetchAccount(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    id: `eq.${accountId}`,
    select:
      "id,name,legal_name,display_name,account_status,lead_status,referral_source,vendor_day_status,licensed_location_id,license_number,address_line_1,address_line_2,city,state,postal_code,country,latitude,longitude,sales_rep_names,account_manager_names,last_contacted_at,last_sample_order_date,last_sample_delivery_date,last_order_date,customer_since_date,crm_updated_at,external_updated_at,custom_fields",
    limit: "1",
  });
  const { data } = await runtimeRestRequest<AccountRow[]>("account", params);
  return data[0] ?? null;
}

async function fetchIdentities(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    account_id: `eq.${accountId}`,
    select: "id,provider,external_entity_type,external_id,match_method,match_confidence,metadata,created_at,updated_at",
    order: "provider.asc",
    limit: "50",
  });
  const { data } = await runtimeRestRequest<IdentityRow[]>("account_identity", params);
  return data.map(mapIdentity);
}

async function fetchContacts(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    account_id: `eq.${accountId}`,
    select: "id,full_name,title,email,phone,role,custom_fields,created_at,updated_at",
    order: "full_name.asc",
    limit: "50",
  });
  const { data } = await runtimeRestRequest<ContactRow[]>("contact", params);
  return data.map(mapContact);
}

async function fetchActivities(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    account_id: `eq.${accountId}`,
    select: "id,contact_id,activity_type,summary,occurred_at,metadata,created_at,updated_at",
    order: "occurred_at.desc",
    limit: "20",
  });
  const { data } = await runtimeRestRequest<ActivityRow[]>("activity", params);
  return data.map(mapActivity);
}

async function fetchOrders(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    account_id: `eq.${accountId}`,
    select: "id,external_order_id,order_number,status,payment_status,order_total,order_created_at,delivery_date,sales_rep_name,is_internal_transfer",
    order: "order_created_at.desc.nullslast",
    limit: "500",
  });
  const { data } = await runtimeRestRequest<OrderRow[]>("order_record", params);
  return data.map(mapOrder);
}

function buildOrderSummary(orders: AccountOrder[], totalOrders: number, account: AccountRuntimeDetail["account"]) {
  const nonTransferOrders = orders.filter((order) => !order.isInternalTransfer);
  const totalRevenue = nonTransferOrders.reduce((sum, order) => sum + (order.orderTotal ?? 0), 0);

  return {
    totalOrders,
    totalRevenue,
    nonTransferOrders: nonTransferOrders.length,
    lastOrderDate: account.lastOrderDate,
    customerSinceDate: account.customerSinceDate,
  };
}

export async function getAccountRuntimeDetail(slug: string, accountId: string): Promise<AccountRuntimeDetail | null> {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const accountRow = await fetchAccount(organization.id, accountId);
  if (!accountRow) {
    return null;
  }

  const account = mapAccount(accountRow);
  const [identities, contacts, activities, orders, totalOrders] = await Promise.all([
    fetchIdentities(organization.id, account.id),
    fetchContacts(organization.id, account.id),
    fetchActivities(organization.id, account.id),
    fetchOrders(organization.id, account.id),
    runtimeExactCount("order_record", organization.id, { account_id: `eq.${account.id}` }),
  ]);

  return {
    organization,
    account,
    identities,
    contacts,
    activities,
    recentOrders: orders.slice(0, 20),
    orderSummary: buildOrderSummary(orders, totalOrders, account),
  };
}

export async function createAccountCheckIn(slug: string, accountId: string, note: string) {
  const normalizedNote = note.trim();
  if (!normalizedNote) {
    throw new Error("Check-in note is required");
  }

  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const accountRow = await fetchAccount(organization.id, accountId);
  if (!accountRow) {
    return null;
  }

  const supabase = getSupabaseAdminClient() as any;
  const now = new Date();
  const { data, error } = await supabase
    .from("activity")
    .insert({
      organization_id: organization.id,
      account_id: accountId,
      activity_type: "field_check_in",
      summary: normalizedNote.slice(0, 180),
      occurred_at: now.toISOString(),
      metadata: {
        source: "map_app_runtime",
        note: normalizedNote,
      },
    })
    .select("id,contact_id,activity_type,summary,occurred_at,metadata,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(`activity:field_check_in:${error.message}`);
  }

  const { error: updateError } = await supabase
    .from("account")
    .update({
      last_contacted_at: now.toISOString().slice(0, 10),
      custom_fields: {
        ...accountRow.custom_fields,
        lastLocalCheckInAt: now.toISOString(),
        lastLocalCheckInPreview: normalizedNote.slice(0, 180),
      },
    })
    .eq("organization_id", organization.id)
    .eq("id", accountId);

  if (updateError) {
    throw new Error(`account:last_contacted_at:${updateError.message}`);
  }

  await auditEvents.record({
    organizationId: organization.id,
    eventType: "account_updated",
    entityType: "account",
    entityId: accountId,
    payload: {
      action: "field_check_in",
      accountName: accountRow.display_name ?? accountRow.name,
      activityId: String(data.id),
      occurredAt: now.toISOString(),
      fields: ["last_contacted_at", "custom_fields.lastLocalCheckInAt", "custom_fields.lastLocalCheckInPreview"],
    },
  });

  return {
    organization,
    activity: mapActivity(data as ActivityRow),
  };
}
