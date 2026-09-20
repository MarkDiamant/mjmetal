import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim().slice(0,120);
    const phone = String(formData.get("phone") || "").trim().slice(0,60);
    const email = String(formData.get("email") || "").trim().slice(0,254);
    const message = String(formData.get("message") || "").trim().slice(0,5000);
    if(!name||(!phone&&!email)||!message) return Response.json({success:false,error:"Please enter your name, contact details and message."},{status:400});
    const esc=(v:string)=>v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0 && file.size <= 10*1024*1024).slice(0,5);

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const { error } = await resend.emails.send({
      from: "M&J Metal <info@mjmetal.co.uk>",
      to: ["mark@mjmetal.co.uk", "jonathan@mjmetal.co.uk"],
      replyTo: email || undefined,
      subject: `New Quote Request - ${name}`,
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${esc(message).replace(/\n/g, "<br/>")}</p>
        <p><strong>Attachments:</strong> ${files.length}</p>
      `,
      attachments,
    });

    if (error) {
      console.error("RESEND ERROR:", error);
      return Response.json({ success: false, error }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("QUOTE FORM ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}