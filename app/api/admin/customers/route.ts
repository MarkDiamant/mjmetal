import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

export async function GET(request: Request) {
  const session = await requirePermission("view_customer_details");
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const response = await supabaseRequest(
    "/rest/v1/mj_customers?select=id,first_name,last_name,phone,email,address_line_1,address_line_2,city,postcode&order=first_name.asc,last_name.asc",
    { method: "GET" },
    session.token,
  );
  if (!response.ok) return NextResponse.json({ error: "Unable to load customers" }, { status: 500 });

  const customers = await response.json() as Array<Record<string, any>>;
  return NextResponse.json({ customers: customers.map((customer) => ({
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    addressLine1: customer.address_line_1 || "",
    addressLine2: customer.address_line_2 || "",
    city: customer.city || "",
    postcode: customer.postcode || "",
  })) });
}
