create unique index if not exists account_org_notion_page_idx
  on public.account (organization_id, ((custom_fields ->> 'notionPageId')))
  where custom_fields ? 'notionPageId';

create unique index if not exists contact_org_notion_page_idx
  on public.contact (organization_id, ((custom_fields ->> 'notionPageId')))
  where custom_fields ? 'notionPageId';

create index if not exists contact_org_account_idx
  on public.contact (organization_id, account_id);

comment on index public.account_org_notion_page_idx is
  'Protects live Notion company sync from creating duplicate accounts for the same source page.';

comment on index public.contact_org_notion_page_idx is
  'Protects live Notion contact sync from creating duplicate contacts for the same source page.';
