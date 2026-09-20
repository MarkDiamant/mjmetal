import { getValidXeroConnection } from "@/lib/crm/xero";

async function xeroJson(sessionToken: string, path: string, init: RequestInit = {}) {
  const connection = await getValidXeroConnection(sessionToken);
  if (!connection) throw new Error("Xero is not connected");

  const response = await fetch(`https://api.xero.com/api.xro/2.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Xero-tenant-id": connection.tenantId,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.Elements?.[0]?.ValidationErrors?.[0]?.Message
      || body?.Detail
      || body?.Message
      || body?.message
      || `Xero request failed (${response.status})`;
    throw new Error(detail);
  }
  return body;
}

export async function createXeroContact(sessionToken: string, customer: Record<string, any>, referencePrefix = "CRM") {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || "Customer";
  const payload = {
    Contacts: [{
      Name: fullName,
      ContactNumber: `${referencePrefix}-${String(customer.id).replace(/-/g, "").slice(0, 20)}`,
      FirstName: customer.first_name || undefined,
      LastName: customer.last_name || undefined,
      EmailAddress: customer.email || undefined,
      Addresses: customer.address_line_1 ? [{
        AddressType: "POBOX",
        AddressLine1: customer.address_line_1,
        AddressLine2: customer.address_line_2 || undefined,
        City: customer.city || undefined,
        PostalCode: customer.postcode || undefined,
      }] : undefined,
      Phones: customer.phone ? [{ PhoneType: "DEFAULT", PhoneNumber: customer.phone }] : undefined,
    }],
  };
  const body = await xeroJson(sessionToken, "/Contacts", { method: "POST", body: JSON.stringify(payload) });
  const contact = body?.Contacts?.[0];
  if (!contact?.ContactID) throw new Error("Xero did not return a contact ID");
  return contact;
}

export async function createXeroDraftInvoice(sessionToken: string, input: {
  contactId: string;
  reference: string;
  description: string;
  amount: number;
  vatRate?: number;
}) {
  const payload = {
    Invoices: [{
      Type: "ACCREC",
      Contact: { ContactID: input.contactId },
      Reference: input.reference,
      Status: "DRAFT",
      LineItems: [{
        Description: input.description,
        Quantity: 1,
        UnitAmount: Number(input.amount.toFixed(2)),
        TaxType: Number(input.vatRate || 0) > 0 ? "OUTPUT2" : "NONE",
      }],
    }],
  };
  const body = await xeroJson(sessionToken, "/Invoices", { method: "POST", body: JSON.stringify(payload) });
  const invoice = body?.Invoices?.[0];
  if (!invoice?.InvoiceID) throw new Error("Xero did not return an invoice ID");
  return invoice;
}

export async function getXeroInvoice(sessionToken: string, invoiceId: string) {
  const body = await xeroJson(sessionToken, `/Invoices/${encodeURIComponent(invoiceId)}`);
  const invoice = body?.Invoices?.[0];
  if (!invoice?.InvoiceID) throw new Error("Xero invoice was not found");
  return invoice;
}
