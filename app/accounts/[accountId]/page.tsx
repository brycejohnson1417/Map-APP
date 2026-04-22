import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, ClipboardList, ExternalLink, MapPin, Package, Users } from "lucide-react";
import { AppFrame } from "@/components/layout/app-frame";
import { getAccountRuntimeDetail } from "@/lib/application/runtime/account-service";
import type { AccountRuntimeDetail } from "@/lib/domain/runtime";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  params: Promise<{ accountId: string }> | { accountId: string };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  if (!value) {
    return "None";
  }

  return value.slice(0, 10);
}

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function formatList(values: string[]) {
  return values.length ? values.join(", ") : "Unassigned";
}

function fieldValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  return String(value);
}

function getSourceCrmHref(detail: AccountRuntimeDetail) {
  const notionIdentity = detail.identities.find((identity) => identity.provider === "notion");
  if (!notionIdentity?.externalId) {
    return null;
  }

  return `https://www.notion.so/${notionIdentity.externalId.replaceAll("-", "")}`;
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BadgeCheck }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--accent-secondary-strong)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-3 last:border-b-0">
      <dt className="text-sm text-[var(--text-tertiary)]">{label}</dt>
      <dd className="max-w-[65%] text-right text-sm font-semibold text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await Promise.resolve(params);
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "picc";
  const detail = await getAccountRuntimeDetail(orgSlug, accountId);

  if (!detail) {
    notFound();
  }

  const sourceCrmHref = getSourceCrmHref(detail);
  const address = [
    detail.account.addressLine1,
    detail.account.addressLine2,
    detail.account.city,
    detail.account.state,
    detail.account.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-5">
          <Link
            href="/territory"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Territory
          </Link>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
                Account detail
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{detail.account.name}</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
                This page shows the same account, rep, referral, order, contact, and activity data used by the territory map.
              </p>
            </div>
            {sourceCrmHref ? (
              <a
                href={sourceCrmHref}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#fff" }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                Source CRM
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Orders" value={String(detail.orderSummary.totalOrders)} icon={Package} />
          <MetricCard label="Revenue" value={formatMoney(detail.orderSummary.totalRevenue)} icon={ClipboardList} />
          <MetricCard label="Contacts" value={String(detail.contacts.length)} icon={Users} />
          <MetricCard label="Last order" value={formatDate(detail.orderSummary.lastOrderDate)} icon={CalendarDays} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Map agreement</h2>
            </div>
            <dl className="mt-5">
              <DetailRow label="Sales rep" value={formatList(detail.account.salesRepNames)} />
              <DetailRow label="Account manager" value={formatList(detail.account.accountManagerNames)} />
              <DetailRow label="Account status" value={fieldValue(detail.account.status)} />
              <DetailRow label="Lead status" value={fieldValue(detail.account.leadStatus)} />
              <DetailRow label="Referral source" value={fieldValue(detail.account.referralSource)} />
              <DetailRow label="Last contacted" value={formatDate(detail.account.lastContactedAt)} />
              <DetailRow label="Sample delivery" value={formatDate(detail.account.lastSampleDeliveryDate)} />
            </dl>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-[var(--accent-success)]" />
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Identity and location</h2>
            </div>
            <dl className="mt-5">
              <DetailRow label="Licensed location ID" value={fieldValue(detail.account.licensedLocationId)} />
              <DetailRow label="License number" value={fieldValue(detail.account.licenseNumber)} />
              <DetailRow label="Address" value={address || "None"} />
              <DetailRow label="Coordinates" value={`${fieldValue(detail.account.latitude)}, ${fieldValue(detail.account.longitude)}`} />
              <DetailRow label="Customer since" value={formatDate(detail.account.customerSinceDate)} />
              <DetailRow label="CRM updated" value={formatDate(detail.account.crmUpdatedAt)} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {detail.identities.map((identity) => (
                <span
                  key={identity.id}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {identity.provider}: {identity.externalEntityType}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
            <div className="border-b border-[var(--border-subtle)] p-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Recent Nabis orders</h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {detail.recentOrders.length ? (
                detail.recentOrders.slice(0, 8).map((order) => (
                  <div key={order.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold">{order.orderNumber || order.externalOrderId}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {fieldValue(order.status)} / {fieldValue(order.paymentStatus)}
                      </p>
                    </div>
                    <div className="text-left text-sm sm:text-right">
                      <p className="font-semibold">{formatMoney(order.orderTotal ?? 0)}</p>
                      <p className="mt-1 text-[var(--text-tertiary)]">{formatDate(order.orderCreatedAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-[var(--text-secondary)]">No local orders are attached to this account.</div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
            <div className="border-b border-[var(--border-subtle)] p-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Contacts and activity</h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {detail.contacts.slice(0, 6).map((contact) => (
                <div key={contact.id} className="p-5">
                  <p className="font-semibold">{contact.fullName}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {[contact.title, contact.email, contact.phone].filter(Boolean).join(" / ") || "No contact detail"}
                  </p>
                </div>
              ))}
              {detail.activities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="p-5">
                  <p className="font-semibold">{activity.summary}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {activity.activityType} / {formatDate(activity.occurredAt)}
                  </p>
                </div>
              ))}
              {!detail.contacts.length && !detail.activities.length ? (
                <div className="p-6 text-sm text-[var(--text-secondary)]">No local contacts or activity are attached to this account.</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
