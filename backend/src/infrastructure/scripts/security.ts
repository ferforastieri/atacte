import { prisma } from '../prisma';
import { allowRegistration } from '../../services/auth/securityService';

async function main() {
  const [action, email] = process.argv.slice(2);
  if (action === 'allow-registration' && email) {
    await allowRegistration(email);
    console.log('Cadastro inicial autorizado para esse email por 15 minutos. Crie a conta manualmente no navegador.');
  } else throw new Error('Use allow-registration EMAIL');
}
main().catch(() => { console.error('Operação de segurança não concluída; confira os argumentos e o estado da instalação.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
