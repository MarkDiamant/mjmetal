import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "");
    const phone = String(formData.get("phone") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    await resend.emails.send({
      from: "M&J Metal <quotes@mjmetal.co.uk>",
      to: [
        "mark@mjmetal.co.uk",
        "jonathan@mjmetal.co.uk",
      ],
      replyTo: email || undefined,
      subject: `New Quote Request - ${name}`,
      html: `
        <h2>New Quote Request</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Message</strong></p>

        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}