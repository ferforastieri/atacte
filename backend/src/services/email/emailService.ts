import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;
  private isEnabled: boolean;

  constructor() {
    const smtpHost = process.env['SMTP_HOST'];
    const smtpPort = process.env['SMTP_PORT'];
    const smtpUser = process.env['SMTP_USER'];
    const smtpPass = process.env['SMTP_PASS'];
    
    this.fromEmail = process.env['EMAIL_FROM'] || 'noreply@atacte.com';
    this.fromName = process.env['EMAIL_FROM_NAME'] || 'Atacte';
    this.isEnabled = !!(smtpHost && smtpPort && smtpUser && smtpPass);

    if (this.isEnabled) {
      const port = parseInt(smtpPort || '587');
      const isSecure = smtpPort === '465';
      
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      this.transporter.verify(() => {});
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      throw new Error('Serviço de email não configurado. Verifique as variáveis SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS.');
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao enviar email: ${errorMessage}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, resetUrl?: string): Promise<boolean> {
    const resetLink = resetUrl 
      ? `${resetUrl}?token=${token}`
      : `Use o token abaixo para redefinir sua senha:\n\n${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha - Atacte</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #22c55e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">Atacte</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111827; margin-top: 0;">Recuperação de Senha</h2>
            
            <p>Olá,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta Atacte.</p>
            
            ${resetUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #22c55e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Redefinir Senha
                </a>
              </div>
              
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                Ou copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all;">${resetLink}</span>
              </p>
            ` : `
              <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; margin-bottom: 10px;">Seu token de recuperação:</p>
                <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #111827; word-break: break-all;">
                  ${token}
                </p>
              </div>
              
              <p>Use este token na tela de recuperação de senha para redefinir sua senha.</p>
            `}
            
            <p style="color: #dc2626; font-weight: 600;">⚠️ Este token expira em 1 hora.</p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Este é um email automático, por favor não responda.<br>
              © ${new Date().getFullYear()} Atacte - Senhas e Notas
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Recuperação de Senha - Atacte

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta Atacte.

${resetUrl ? `Acesse este link para redefinir sua senha:\n${resetLink}` : `Use este token para redefinir sua senha:\n\n${token}`}

⚠️ Este token expira em 1 hora.

Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.

© ${new Date().getFullYear()} Atacte - Senhas e Notas
    `;

    return this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Atacte',
      html,
      text,
    });
  }
}

export const emailService = new EmailService();

