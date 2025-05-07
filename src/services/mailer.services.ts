import nodemailer from 'nodemailer'

export const sendMail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  await transporter.sendMail({
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  })
}
